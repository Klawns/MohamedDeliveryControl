import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { CACHE_PROVIDER } from '../../cache/interfaces/cache-provider.interface';
import type { ICacheProvider } from '../../cache/interfaces/cache-provider.interface';

export interface WebhookJobData {
  userId: string;
  plan: 'starter' | 'premium' | 'lifetime';
  eventId: string; // Para idempotência futura se necessário
}

@Processor('webhooks')
export class WebhookWorker extends WorkerHost {
  private readonly logger = new Logger(WebhookWorker.name);

  constructor(
    private subscriptionsService: SubscriptionsService,
    @Inject(CACHE_PROVIDER) private cache: ICacheProvider,
  ) {
    super();
  }

  async process(job: Job<WebhookJobData>): Promise<void> {
    const { userId, plan, eventId } = job.data;

    this.logger.log(
      `Processando Webhook - Job ID: ${job.id} | Usuário: ${userId} | Plano: ${plan}`,
    );

    // Guard against previously enqueued bad data (e.g. product IDs instead of user IDs)
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
      this.logger.log(`Webhook Processado com Sucesso - Job ID: ${job.id}`);
    } catch (error) {
      this.logger.error(`Falha ao processar job ${job.id}: ${error.message}`);
      // Lançar o erro faz com que o BullMQ tente novamente (retry)
      throw error;
    }
  }
}
