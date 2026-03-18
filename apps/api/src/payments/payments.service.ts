import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Audit } from '../common/decorators/audit.decorator';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

import { UsersService } from '../users/users.service';
import type {
  IPaymentProvider,
  PaymentPlan,
} from './providers/payment-provider.interface';
import { PAYMENT_PROVIDER } from './providers/payment-provider.interface';
import { CACHE_PROVIDER } from '../cache/interfaces/cache-provider.interface';
import type { ICacheProvider } from '../cache/interfaces/cache-provider.interface';
import { IPaymentsRepository } from './interfaces/payments-repository.interface';

import {
  PaymentEvents,
  PaymentWebhookReceivedEvent,
} from './events/payment.events';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PAYMENT_PROVIDER)
    private provider: IPaymentProvider,
    @Inject(CACHE_PROVIDER)
    private cache: ICacheProvider,
    private usersService: UsersService,
    private configService: ConfigService,
    @Inject(IPaymentsRepository)
    private readonly paymentsRepository: IPaymentsRepository,
    private eventEmitter: EventEmitter2,
  ) {}

  @Audit()
  async createCheckoutSession(
    userId: string,
    plan: PaymentPlan,
    couponCode?: string,
  ) {
    const user = await this.usersService.findById(userId);
    const dbPlan = await this.paymentsRepository.getPlanById(plan);

    console.log(
      `[PaymentsService] Iniciando checkout. ID: ${userId}, Nome DB: ${user?.name}, Email DB: ${user?.email}, Plano: ${plan}`,
    );

    if (!dbPlan) {
      throw new Error('Plano não encontrado');
    }

    return this.provider.createCheckoutSession(
      userId,
      plan,
      dbPlan.price,
      user
        ? {
            name: user.name,
            email: user.email,
            taxId: user.taxId ?? undefined,
            cellphone: user.cellphone ?? undefined,
          }
        : undefined,
      couponCode ? [couponCode] : undefined,
      dbPlan.name,
    );
  }

  async getPlans() {
    const cacheKey = 'pricing:all_plans';

    try {
      // 1. Tenta buscar do Cache Rápido (Redis)
      const cachedPlans = await this.cache.get<any[]>(cacheKey);
      if (cachedPlans) {
        console.log(
          '[PaymentsService] Retornando planos do Cache (Redis). Velocidade Máxima!',
        );
        return cachedPlans;
      }

      // 2. Fallback: Busca do Banco de Dados (Turso)
      const plans = await this.paymentsRepository.getAllPlans();
      const parsedPlans = plans.map((plan) => {
        let features = [];
        try {
          features =
            typeof plan.features === 'string'
              ? JSON.parse(plan.features)
              : plan.features || [];
        } catch (e) {
          console.error(
            `[PaymentsService] Erro ao parsear features do plano ${plan.id}:`,
            e.message,
          );
        }
        return {
          ...plan,
          features: Array.isArray(features) ? features : [],
        };
      });

      // 3. Salva no Cache para a próxima requisição (TTL = 1 hora)
      await this.cache.set(cacheKey, parsedPlans, 3600);

      return parsedPlans;
    } catch (error) {
      console.error('[PaymentsService] Erro ao buscar planos:', error.message);
      throw new Error('Falha ao carregar planos de pagamento');
    }
  }

  @Audit()
  async handleWebhook(signature: string, payload: Buffer, query?: any) {
    // 1. Evita processamento duplo do MESMO webhook (Retentativas de rede)
    // Geramos um hash único do corpo da requisição para identificar se é o MESMO aviso
    const payloadHash = crypto
      .createHash('sha256')
      .update(payload)
      .digest('hex');
    const idempotencyKey = `webhook:processed:${payloadHash}`;

    const alreadyProcessed = await this.cache.get(idempotencyKey);
    if (alreadyProcessed) {
      console.log(
        `[Webhook] 🛡️ Webhook já em processamento ou finalizado. Ignorando duplicata.`,
      );
      return { received: true };
    }

    // Marca como processando por 60 segundos (Tempo seguro para evitar race condition de rede)
    await this.cache.set(idempotencyKey, 'processing', 60);

    const result = await this.provider.handleWebhook(signature, payload, query);

    if (result.userId && result.plan) {
      let userId = result.userId;

      // Se o identificador for um e-mail (fallback do provider), resolve para o ID do usuário
      if (userId.includes('@')) {
        const user = await this.usersService.findByEmail(userId);
        if (user) {
          console.log(
            `[Webhook] Resolvendo e-mail ${userId} para o ID ${user.id}`,
          );
          userId = user.id;
        } else {
          console.error(
            `[Webhook ERROR] Pagamento recebido, mas NENHUM usuário encontrado com o e-mail: ${userId}.`,
          );
          return { received: true };
        }
      }

      const plan = result.plan.toLowerCase() as
        | 'starter'
        | 'premium'
        | 'lifetime';
      console.log(
        `[Webhook] Emitindo evento de pagamento. Usuário: ${userId}, Novo Plano: ${plan}`,
      );

      // Emite o evento (Observer Pattern)
      this.eventEmitter.emit(
        PaymentEvents.WEBHOOK_RECEIVED,
        new PaymentWebhookReceivedEvent(
          userId,
          plan,
          result.eventId || crypto.randomUUID(),
        ),
      );
    }

    return { received: true };
  }
}
