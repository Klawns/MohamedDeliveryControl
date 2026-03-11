import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { UsersService } from '../users/users.service';
import type { IPaymentProvider, PaymentPlan } from './providers/payment-provider.interface';
import { PAYMENT_PROVIDER } from './providers/payment-provider.interface';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.provider';
import * as schema from '@mdc/database';

@Injectable()
export class PaymentsService {
    constructor(
        @Inject(PAYMENT_PROVIDER)
        private provider: IPaymentProvider,
        private subscriptionsService: SubscriptionsService,
        private usersService: UsersService,
        private configService: ConfigService,
        @Inject(DRIZZLE)
        private db: LibSQLDatabase<typeof schema>,
    ) { }

    async createCheckoutSession(userId: string, plan: PaymentPlan, couponCode?: string) {
        const user = await this.usersService.findById(userId);
        const [dbPlan] = await this.db.select().from(schema.pricingPlans).where(eq(schema.pricingPlans.id, plan));

        console.log(`[PaymentsService] Iniciando checkout. ID: ${userId}, Nome DB: ${user?.name}, Email DB: ${user?.email}, Plano: ${plan}`);

        if (!dbPlan) {
            throw new Error('Plano não encontrado');
        }

        return this.provider.createCheckoutSession(userId, plan, dbPlan.price, user ? {
            name: user.name,
            email: user.email,
            taxId: user.taxId ?? undefined,
            cellphone: user.cellphone ?? undefined,
        } : undefined, couponCode ? [couponCode] : undefined);
    }

    async getPlans() {
        const plans = await this.db.select().from(schema.pricingPlans);
        return plans.map(plan => ({
            ...plan,
            features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
        }));
    }



    async handleWebhook(signature: string, payload: Buffer) {
        const result = await this.provider.handleWebhook(signature, payload);

        if (result.userId && result.plan) {
            let userId = result.userId;

            // Se o identificador for um e-mail (fallback do provider), resolve para o ID do usuário
            if (userId.includes('@')) {
                const user = await this.usersService.findByEmail(userId);
                if (user) {
                    console.log(`[Webhook] Resolvendo e-mail ${userId} para o ID ${user.id}`);
                    userId = user.id;
                } else {
                    console.error(`[Webhook] Nenhum usuário encontrado para o e-mail: ${userId}`);
                    return { received: true };
                }
            }

            const plan = result.plan.toLowerCase() as 'starter' | 'premium' | 'lifetime';
            console.log(`[Webhook] Processando atribuição de plano. Usuário: ${userId}, Novo Plano: ${plan}`);

            await this.subscriptionsService.updateOrCreate(userId, plan);
        }

        return { received: true };
    }
}
