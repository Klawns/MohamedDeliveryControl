/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Payment provider responses and cached payloads are runtime-shaped integration boundaries. */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
  private readonly logger = new Logger(PaymentsService.name);

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

  async createCheckoutSession(
    userId: string,
    plan: PaymentPlan,
    couponCode?: string,
  ) {
    const user = await this.usersService.findById(userId);
    const dbPlan = await this.paymentsRepository.getPlanById(plan);

    this.logger.log(`Iniciando checkout. ID: ${userId}, Plano: ${plan}`);

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
        this.logger.log('Retornando planos do Cache (Redis)');
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
          this.logger.error(
            `Erro ao parsear features do plano ${plan.id}: ${e.message}`,
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
      this.logger.error(
        `Falha ao carregar planos: ${error.message}`,
        error.stack,
      );
      throw new Error(
        `Falha ao carregar planos de pagamento: ${error.message}`,
      );
    }
  }

  async handleWebhook(
    signature: string,
    payload: Buffer,
    query?: any,
    timestamp?: string,
  ) {
    // 1. Valida a assinatura e extrai o eventId (O provider agora retorna eventId obrigatório)
    const result = await this.provider.handleWebhook(signature, payload, query);
    const eventId = result.eventId;

    // 2. Validação de Timestamp (Replay Attack)
    if (timestamp) {
      const webhookTime = parseInt(timestamp, 10);
      const currentTime = Math.floor(Date.now() / 1000);
      const tolerance = parseInt(
        this.configService.get('WEBHOOK_WINDOW_SECONDS', '300'),
        10,
      );

      if (Math.abs(currentTime - webhookTime) > tolerance) {
        this.logger.error(
          `Webhook ignorado: fora da janela de expiração. Event: ${eventId}`,
        );
        throw new Error('Webhook expired');
      }
    }

    // 3. Evita processamento duplo baseado no eventId do provider
    const idempotencyKey = `webhook:processed:${eventId}`;
    const alreadyProcessed = await this.cache.get(idempotencyKey);

    if (alreadyProcessed === 'completed' || alreadyProcessed === 'processing') {
      this.logger.warn(
        `Webhook ${eventId} já processado ou em processamento. Ignorando duplicata.`,
      );
      return { received: true };
    }

    // Marca como processando por 72 horas (259.200 segundos)
    const TTL_72H = 259200;
    await this.cache.set(idempotencyKey, 'processing', TTL_72H);

    try {
      if (result.userId && result.plan) {
        const userId = result.userId;
        const plan = result.plan.toLowerCase() as
          | 'starter'
          | 'premium'
          | 'lifetime';

        this.eventEmitter.emit(
          PaymentEvents.WEBHOOK_RECEIVED,
          new PaymentWebhookReceivedEvent(userId, plan, eventId),
        );
      }

      // Marca como finalizado com sucesso
      await this.cache.set(idempotencyKey, 'completed', TTL_72H);
    } catch (error) {
      // Em caso de erro, removemos a trava para permitir retentativa do provider
      // ou marcamos como falha dependendo da estratégia. Aqui removemos para retry.
      await this.cache.set(idempotencyKey, 'failed', 3600); // 1h de block para erro crítico
      this.logger.error(
        `Erro ao processar webhook ${eventId}: ${error.message}`,
      );
      throw error;
    }

    return { received: true };
  }
}
