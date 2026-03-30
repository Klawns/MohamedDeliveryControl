import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import type { Subscription } from '../../subscriptions/interfaces/subscriptions-repository.interface';
import type { JwtRequestUser } from '../auth.types';

type SubscriptionRequest = {
  user?: JwtRequestUser & { subscription?: Subscription };
  subscription?: Subscription;
};

@Injectable()
export class ActiveSubscriptionGuard implements CanActivate {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<SubscriptionRequest>();
    const { user } = request;

    if (user?.role === 'admin') {
      return true;
    }

    if (!user?.id) {
      throw new ForbiddenException(
        'Sessão inválida para validar a assinatura.',
      );
    }

    const access = await this.subscriptionsService.getAccessSnapshot(user.id);

    if (access.subscription) {
      request.subscription = access.subscription;
      user.subscription = access.subscription;
    }

    switch (access.status) {
      case 'active':
        return true;
      case 'expired':
        throw new ForbiddenException(
          access.subscription?.plan === 'starter'
            ? 'Seu periodo gratuito de 7 dias expirou. Assine para continuar.'
            : 'Sua assinatura premium expirou. Renove o plano para continuar.',
        );
      case 'inactive':
        throw new ForbiddenException(
          'Sua assinatura está inativa. Atualize o plano para continuar.',
        );
      case 'invalid':
        throw new ForbiddenException(
          'Sua assinatura premium está inconsistente. Entre em contato com o suporte.',
        );
      default:
        throw new ForbiddenException(
          'Nenhuma assinatura ativa foi encontrada para este usuário.',
        );
    }
  }
}
