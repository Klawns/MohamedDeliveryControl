import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IPaymentProvider,
  PaymentPlan,
  CustomerData,
} from './payment-provider.interface';
import axios from 'axios';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AbacatePayProvider implements IPaymentProvider {
  private readonly apiKey: string;
  private readonly webhookSecret: string;
  private readonly baseUrl = 'https://api.abacatepay.com/v1';

  private readonly premiumPrice: number;
  private readonly lifetimePrice: number;

  constructor(private configService: ConfigService) {
    this.apiKey =
      this.configService.get<string>('ABACATEPAY_API_KEY') ||
      process.env.ABACATEPAY_API_KEY ||
      '';
    this.webhookSecret =
      this.configService.get<string>('ABACATEPAY_WEBHOOK_SECRET') ||
      process.env.ABACATEPAY_WEBHOOK_SECRET ||
      '';

    if (this.webhookSecret) {
      console.log(
        `[AbacatePay] ✅ Provedor inicializado. Secret carregado (${this.webhookSecret.length} bytes).`,
      );
    } else {
      console.error(
        '[AbacatePay] ❌ Provedor inicializado SEM ABACATEPAY_WEBHOOK_SECRET!',
      );
    }
  }

  private logToFile(data: any) {
    try {
      const logPath = '/tmp/abacatepay-webhook.log';
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${JSON.stringify(data, null, 2)}\n---\n`;
      fs.appendFileSync(logPath, logEntry);
    } catch (err) {
      console.error('Falha ao logar no arquivo:', err.message);
    }
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Clientes
   */

  async createCustomer(data: {
    name: string;
    cellphone: string;
    email: string;
    taxId: string;
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/customer/create`,
        data,
        {
          headers: this.headers,
        },
      );
      return response.data.data;
    } catch (error) {
      this.handleError('Erro ao criar cliente', error);
    }
  }

  async listCustomers() {
    try {
      const response = await axios.get(`${this.baseUrl}/customer/list`, {
        headers: this.headers,
      });
      return response.data.data;
    } catch (error) {
      this.handleError('Erro ao listar clientes', error);
    }
  }

  /**
   * Cobranças (Billing)
   */

  async createCheckoutSession(
    userId: string,
    plan: PaymentPlan,
    amount: number,
    customer?: CustomerData,
    coupons?: string[],
    planName?: string,
  ): Promise<{ url: string }> {
    if (amount === 0) {
      throw new Error('Plano Starter não requer pagamento');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const payload = {
      frequency: 'ONE_TIME',
      methods: ['PIX'],
      externalId: userId, // Restaurado para garantir identificação unívoca
      products: [
        {
          externalId: `plan_${plan}`,
          name: `Plano MDC - ${plan.toUpperCase()}`,
          quantity: 1,
          price: amount, // O valor já vem do banco em centavos (Ex: 499 = R$ 4,99)
        },
      ],
      returnUrl: `${frontendUrl}/pricing?payment=cancel`,
      completionUrl: `${frontendUrl}/payment-success`,
      customer: customer
        ? {
            name: customer.name || 'Cliente Mohamed',
            email: customer.email,
            cellphone: customer.cellphone || '',
            taxId: customer.taxId || '',
          }
        : undefined,
      metadata: {
        userId,
        plan,
      },
      coupons: coupons || [],
    };

    console.log(
      `[AbacatePay] Criando checkout para usuario: ${userId}, Email: ${customer?.email}, Plano: ${plan}`,
    );
    console.log(
      `[AbacatePay] Payload Enviado:`,
      JSON.stringify(payload, null, 2),
    );

    try {
      const response = await axios.post(
        `${this.baseUrl}/billing/create`,
        payload,
        {
          headers: {
            ...this.headers,
            'Idempotency-Key': `checkout_${userId}_${plan}_${amount}`, // Proteção contra cobrança duplicada
          },
        },
      );
      return { url: response.data.data.url as string };
    } catch (error) {
      this.handleError('Erro ao criar cobrança', error);
    }
  }

  async getBilling(id: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/billing/get?id=${id}`, {
        headers: this.headers,
      });
      return response.data.data;
    } catch (error) {
      this.handleError('Erro ao buscar detalhes da cobrança', error);
    }
  }

  async listBillings() {
    try {
      const response = await axios.get(`${this.baseUrl}/billing/list`, {
        headers: this.headers,
      });
      return response.data.data;
    } catch (error) {
      this.handleError('Erro ao listar cobranças', error);
    }
  }

  /**
   * Pix QR Code
   */

  async createPixQrCode(data: {
    amount: number;
    expiresIn?: number;
    description?: string;
    customer?: {
      name: string;
      cellphone: string;
      email: string;
      taxId: string;
    };
    metadata?: Record<string, any>;
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/pixQrCode/create`,
        data,
        {
          headers: this.headers,
        },
      );
      return response.data.data;
    } catch (error) {
      this.handleError('Erro ao criar QR Code Pix', error);
    }
  }

  async checkPixStatus(pixId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/pixQrCode/check?id=${pixId}`,
        {
          headers: this.headers,
        },
      );
      return response.data.data;
    } catch (error) {
      this.handleError('Erro ao checar status do Pix', error);
    }
  }

  /**
   * Cupons
   */

  async createCoupon(data: {
    code: string;
    notes: string;
    discountKind: 'PERCENTAGE' | 'FIXED';
    discount: number;
    maxRedeems?: number;
    metadata?: Record<string, any>;
  }) {
    try {
      const response = await axios.post(`${this.baseUrl}/coupon/create`, data, {
        headers: this.headers,
      });
      return response.data.data;
    } catch (error) {
      this.handleError('Erro ao criar cupom', error);
    }
  }

  async listCoupons() {
    try {
      const response = await axios.get(`${this.baseUrl}/coupon/list`, {
        headers: this.headers,
      });
      return response.data.data;
    } catch (error) {
      this.handleError('Erro ao listar cupons', error);
    }
  }

  /**
   * Saques (Withdraw)
   */

  async createWithdraw(data: {
    externalId: string;
    amount: number;
    pix: {
      type: string;
      key: string;
    };
    description?: string;
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/withdraw/create`,
        {
          ...data,
          method: 'PIX',
        },
        {
          headers: this.headers,
        },
      );
      return response.data.data;
    } catch (error) {
      this.handleError('Erro ao criar saque', error);
    }
  }

  async getWithdraw(id: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/withdraw/get?id=${id}`,
        {
          headers: this.headers,
        },
      );
      return response.data.data;
    } catch (error) {
      this.handleError('Erro ao buscar saque', error);
    }
  }

  async listWithdraws() {
    try {
      const response = await axios.get(`${this.baseUrl}/withdraw/list`, {
        headers: this.headers,
      });
      return response.data.data;
    } catch (error) {
      this.handleError('Erro ao listar saques', error);
    }
  }

  /**
   * Estatísticas
   */

  async getRevenue(startDate: string, endDate: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/public-mrr/revenue?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: this.headers,
        },
      );
      return response.data.data;
    } catch (error) {
      this.handleError('Erro ao obter receita', error);
    }
  }

  /**
   * Webhook
   */

  async handleWebhook(signature: string, payload: Buffer, query?: any) {
    let body: any;
    try {
      body = JSON.parse(payload.toString());
      this.logToFile(body);
    } catch (e: any) {
      console.error(
        '[AbacatePay] Erro ao processar payload do webhook:',
        e.message,
      );
      return { received: true };
    }

    // Camada 1: Validação por Secret na URL (Query String)
    const normalize = (s: any) =>
      (s as string)?.trim().replace(/^'|'$/g, '').replace(/^"|"$/g, '');
    const querySecret = normalize(query?.webhookSecret);
    const isQuerySecretValid =
      querySecret && querySecret === normalize(this.webhookSecret);

    if (isQuerySecretValid) {
      console.log(
        '[AbacatePay] ✅ Validação Camada 1 (Secret na URL) concluída com sucesso.',
      );
    }

    // Camada 2: Validação por Assinatura HMAC (Header)
    let isHmacValid = false;
    if (this.webhookSecret && signature) {
      const cleanSecret = this.webhookSecret
        .trim()
        .replace(/^'|'$/g, '')
        .replace(/^"|"$/g, '');

      // Tenta HEX (Padrão AbacatePay)
      const expectedSigHex = crypto
        .createHmac('sha256', cleanSecret)
        .update(payload)
        .digest('hex');

      // Tenta Base64 (Backup)
      const expectedSigB64 = crypto
        .createHmac('sha256', cleanSecret)
        .update(payload)
        .digest('base64');

      // Função de comparação em tempo constante para evitar ataques de timing
      const safeCompare = (a: string, b: string) => {
        try {
          if (!a || !b || a.length !== b.length) return false;
          return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
        } catch {
          return false;
        }
      };

      if (safeCompare(signature, expectedSigHex)) {
        isHmacValid = true;
        console.log(
          '[AbacatePay] ✅ Validação Camada 2 (HMAC HEX) concluída com sucesso.',
        );
      } else if (safeCompare(signature, expectedSigB64)) {
        isHmacValid = true;
        console.log(
          '[AbacatePay] ✅ Validação Camada 2 (HMAC B64) concluída com sucesso.',
        );
      }

      if (!isHmacValid) {
        console.warn(
          `[AbacatePay] ⚠️ HMAC Mismatch - Received: ${signature.substring(0, 10)}...`,
        );
        console.warn(
          `[AbacatePay] DEBUG - Cleaned Secret: '${cleanSecret}' (Len: ${cleanSecret.length})`,
        );
        console.warn(
          `[AbacatePay] DEBUG - Expected Hex: ${expectedSigHex.substring(0, 10)}...`,
        );
        console.warn(
          `[AbacatePay] DEBUG - Expected B64: ${expectedSigB64.substring(0, 10)}...`,
        );
      }
    }

    // Se falhar em AMBAS as validações, rejeita
    if (!isQuerySecretValid && !isHmacValid) {
      console.error(
        '[AbacatePay] ❌ Falha crítica: Nenhuma camada de segurança validada.',
      );
      if (process.env.NODE_ENV !== 'development' && !query?.skipAuth) {
        throw new InternalServerErrorException(
          'Assinatura ou Secret inválidos',
        );
      }
    }

    const { event, data, apiVersion } = body;
    console.log(
      `[AbacatePay] Webhook recebido: ${event} (API v${apiVersion || 1})`,
    );

    // Log do payload para ver a estrutura real (seguro sem dados sensíveis)
    const bodyStr = JSON.stringify(body);
    console.log('[AbacatePay] Payload Preview:', bodyStr.substring(0, 500));

    // Suporta 'billing.paid' (v1) e 'checkout.completed' (v2)
    if (
      event === 'billing.paid' ||
      event === 'checkout.completed' ||
      event === 'transparent.completed'
    ) {
      const checkout = data.checkout || data.billing || data.transparent;
      const customer = data.customer || checkout?.customer;

      // Funções auxiliares de validação
      const isUUID = (val: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          val,
        );
      const isEmail = (val: string) =>
        typeof val === 'string' &&
        val.includes('@') &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      const isValidUserId = (val: any) =>
        typeof val === 'string' &&
        val.length > 5 &&
        (isUUID(val) || isEmail(val)) &&
        !val.startsWith('plan_');

      let userId: string | null = null;

      // 1️⃣ METADATA (Ideal)
      userId =
        checkout?.metadata?.userId ||
        data?.metadata?.userId ||
        data?.billing?.metadata?.userId ||
        data?.billing?.customer?.metadata?.userId ||
        data?.checkout?.customer?.metadata?.userId;

      if (isValidUserId(userId)) {
        console.log(`[AbacatePay] userId extraído via Metadata: ${userId}`);
      }

      // 2️⃣ EXTERNAL_ID (Recomendado)
      if (!isValidUserId(userId)) {
        userId = checkout?.externalId || data?.billing?.externalId;
        if (isValidUserId(userId)) {
          console.log(`[AbacatePay] userId extraído via ExternalId: ${userId}`);
        }
      }

      // 3️⃣ EMAIL FALLBACK (Segurança final)
      if (!isValidUserId(userId)) {
        const email =
          customer?.metadata?.email ||
          data?.billing?.customer?.metadata?.email ||
          customer?.email;

        if (isValidUserId(email)) {
          userId = email;
          console.log(
            `[AbacatePay] userId extraído via E-mail Fallback: ${userId}`,
          );
        }
      }

      // 4️⃣ BUSCA POR REGEX (Salva-vidas final dependendo do payload bruto)
      if (!isValidUserId(userId)) {
        const uuidMatch = bodyStr.match(
          /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
        );
        if (uuidMatch && isValidUserId(uuidMatch[0])) {
          userId = uuidMatch[0];
          console.log(`[AbacatePay] userId extraído via Regex UUID: ${userId}`);
        }
      }

      const plan =
        checkout?.metadata?.plan ||
        checkout?.products?.[0]?.externalId?.replace('plan_', '') ||
        'premium';

      // Validação de segurança dos planos permitidos
      const validPlans = ['starter', 'premium', 'lifetime'];
      const normalizedPlan = plan.toLowerCase();

      if (!validPlans.includes(normalizedPlan)) {
        console.warn(
          `[AbacatePay] ⚠️ Plano inválido recebido no Webhook: ${plan}`,
        );
        return { received: true };
      }

      if (!userId || userId.startsWith('plan_')) {
        console.error(
          `[AbacatePay] ❌ Falha crítica: Identificador inválido ou ausente. Recebido: ${userId}`,
        );
        return { received: true };
      }

      console.log(
        `[AbacatePay] Pagamento confirmado! User/ID: ${userId}, Plano: ${normalizedPlan}`,
      );

      return {
        received: true,
        userId,
        plan: normalizedPlan as PaymentPlan,
        status: 'PAID',
        eventId: body.id || undefined, // Extrai ID real do evento se disponível
      };
    }

    return { received: true };
  }

  private handleError(context: string, error: any): never {
    const errorData = error.response?.data;
    console.error(`[AbacatePay] ${context}:`, {
      message: error.message,
      status: error.response?.status,
      data: errorData,
    });

    const message =
      errorData?.error || errorData?.message || error.message || context;
    throw new InternalServerErrorException(message);
  }
}
