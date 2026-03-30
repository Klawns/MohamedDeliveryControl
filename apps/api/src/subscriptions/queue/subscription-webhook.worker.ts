import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { SubscriptionsService } from '../subscriptions.service';
import { CACHE_PROVIDER } from '../../cache/interfaces/cache-provider.interface';
import type { ICacheProvider } from '../../cache/interfaces/cache-provider.interface';

export interface WebhookJobData {
  userId: string;
  plan: 'starter' | 'premium' | 'lifetime';
  eventId: string; // Para idempotência futura se necessário
}

@Processor('webhooks')
export class SubscriptionWebhookWorker extends WorkerHost {
  private readonly logger = new Logger(SubscriptionWebhookWorker.name);

  constructor(
    private subscriptionsService: SubscriptionsService,
    @Inject(CACHE_PROVIDER) private cache: ICacheProvider,
  ) {
    super();
  }

  async process(job: Job<WebhookJobData>): Promise<void> {
    const { userId, plan } = job.data;

    this.logger.log(
      `Processando Worker de Assinatura - Job ID: ${job.id} | Usuário: ${userId} | Plano: ${plan}`,
    );

    // Guard against previously enqueued bad data
    if (!userId || userId.startsWith('plan_')) {
      this.logger.warn(
        `Job ${job.id} descartado: Identificador de usuário inválido (${userId})`,
      );
      return;
    }

    try {
      await this.subscriptionsService.updateOrCreate(userId, plan);
      // Invalidate the cache so the frontend /auth/me polling gets the new plan immediately
      await this.cache.del(`profile:${userId}`);
      this.logger.log(`Assinatura Processada com Sucesso - Job ID: ${job.id}`);
    } catch (error: unknown) {
      this.logger.error(
        `Falha ao processar job de assinatura ${job.id}: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
      );
      throw error;
    }
  }
}
