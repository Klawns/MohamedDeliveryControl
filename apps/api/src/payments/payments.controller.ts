import {
  Controller,
  Post,
  Get,
  Req,
  Headers,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ZodBody } from '../common/decorators/zod.decorator';
import { checkoutSchema } from './dto/payments.dto';
import { Audit } from '../common/decorators/audit.decorator';
import type { CheckoutDto } from './dto/payments.dto';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import * as express from 'express';
import type { RequestWithUser } from '../auth/auth.types';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Get('plans')
  getPlans() {
    return this.paymentsService.getPlans();
  }

  @Audit({ action: 'Checkout Create' })
  @Post('checkout')
  createCheckout(
    @ZodBody(checkoutSchema) body: CheckoutDto,
    @Req() req: RequestWithUser,
  ) {
    return this.paymentsService.createCheckoutSession(
      req.user.id,
      body.plan,
      body.couponCode,
    );
  }

  @Audit({ action: 'Payment Webhook' })
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('webhook')
  async handleWebhook(
    @Headers('x-signature') signature: string,
    @Headers('x-timestamp') timestamp: string,
    @Req() request: RawBodyRequest<express.Request>,
  ) {
    if (!signature || !request.rawBody) {
      throw new UnauthorizedException('Missing signature or body content');
    }

    try {
      return await this.paymentsService.handleWebhook(
        signature,
        request.rawBody,
        request.query,
        timestamp,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao processar webhook: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
      );
      throw error;
    }
  }
}
