import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Headers,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentPlan } from './providers/payment-provider.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import * as express from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('plans')
  async getPlans() {
    return this.paymentsService.getPlans();
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async createCheckout(
    @Body() body: { plan: PaymentPlan; couponCode?: string },
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.paymentsService.createCheckoutSession(
      userId,
      body.plan,
      body.couponCode,
    );
  }

  @Post('webhook')
  async handleWebhook(
    @Headers('x-webhook-signature') sig1: string,
    @Headers('x-abacatepay-signature') sig2: string,
    @Headers('x-signature') sig3: string,
    @Req() request: RawBodyRequest<express.Request>,
  ) {
    const signature = sig1 || sig2 || sig3;
    console.log(`[Webhook] 📥 Requisição recebida em /payments/webhook`);
    console.log(
      `[Webhook] Signature Header: ${signature ? 'Presente' : 'AUSENTE'}`,
    );
    console.log(
      `[Webhook] RawBody: ${request.rawBody ? 'Presente (' + request.rawBody.length + ' bytes)' : 'AUSENTE'}`,
    );

    if (!signature || !request.rawBody) {
      console.error(
        '[Webhook] ❌ Falha na validação inicial: Assinatura ou corpo ausente.',
      );
      throw new UnauthorizedException('Missing signature or body content');
    }

    try {
      return await this.paymentsService.handleWebhook(
        signature,
        request.rawBody,
        request.query,
      );
    } catch (error) {
      console.error(`[Webhook] ❌ Erro ao processar: ${error.message}`);
      throw error;
    }
  }
}
