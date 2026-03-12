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
    this.apiKey = this.configService.get<string>('ABACATEPAY_API_KEY') || process.env.ABACATEPAY_API_KEY || '';
    this.webhookSecret =
      this.configService.get<string>('ABACATEPAY_WEBHOOK_SECRET') || process.env.ABACATEPAY_WEBHOOK_SECRET || '';

    if (this.webhookSecret) {
      console.log(`[AbacatePay] ✅ Provedor inicializado. Secret carregado (${this.webhookSecret.length} bytes).`);
    } else {
      console.error('[AbacatePay] ❌ Provedor inicializado SEM ABACATEPAY_WEBHOOK_SECRET!');
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
  ): Promise<{ url: string }> {
    if (amount === 0) {
      throw new Error('Plano Starter não requer pagamento');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const payload = {
      frequency: 'ONE_TIME',
      methods: ['PIX'],
      // externalId: userId, // REMOVIDO para testar se o AbacatePay pára de usar dados antigos do cliente
      products: [
        {
          externalId: `plan_${plan}`,
          name: `Plano MDC - ${plan.toUpperCase()}`,
          quantity: 1,
          price: amount,
        },
      ],
      returnUrl: `${frontendUrl}/pricing?payment=cancel`,
      completionUrl: `${frontendUrl}/payment-success`,
      customer: customer
        ? {
          name: customer.name || 'Cliente Mohamed',
          email: customer.email, // fabingames13@gmail.com
          cellphone: customer.cellphone || '',
          taxId: customer.taxId || '',
        }
        : undefined,
      metadata: {
        userId, // Identificador ÚNICO via metadata para o Webhook me achar
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
          headers: this.headers,
        },
      );
      return { url: response.data.data.url as string };
    } catch (error) {
      this.handleError('Erro ao criar cobrança', error);
    }
  }

  async getBilling(id: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/billing/list`, {
        headers: this.headers,
      });
      // O AbacatePay não possui endpoint direto /get?id= para billing aparentemente,
      // vamos filtrar na listagem ou tentar um chute no endpoint se documentado
      const billings = response.data.data as any[];
      return billings.find((b) => b.id === id);
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
    const querySecret = query?.webhookSecret;
    const isQuerySecretValid = querySecret && querySecret === this.webhookSecret;

    if (isQuerySecretValid) {
      console.log('[AbacatePay] ✅ Validação Camada 1 (Secret na URL) concluída com sucesso.');
    }

    // Camada 2: Validação por Assinatura HMAC (Header)
    let isHmacValid = false;
    if (this.webhookSecret) {
      const expectedSig = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('base64');

      const A = Buffer.from(expectedSig);
      const B = Buffer.from(signature);

      isHmacValid = A.length === B.length && crypto.timingSafeEqual(A, B);

      if (!isHmacValid) {
        console.warn(
          `[AbacatePay] ⚠️ HMAC Mismatch - Received: ${signature.substring(0, 10)}..., Expected: ${expectedSig.substring(0, 10)}...`,
        );
        console.warn(
          `[AbacatePay] INFO - WebhookSecret Configurado: ${this.webhookSecret.length} chars, Começa com: ${this.webhookSecret.substring(0, 2)}...`,
        );
      } else {
        console.log('[AbacatePay] ✅ Validação Camada 2 (HMAC) concluída com sucesso.');
      }
    }

    // Se falhar em AMBAS as validações, rejeita
    if (!isQuerySecretValid && !isHmacValid) {
      console.error('[AbacatePay] ❌ Falha crítica: Nenhuma camada de segurança validada.');
      if (process.env.NODE_ENV !== 'development') {
        throw new InternalServerErrorException('Assinatura ou Secret inválidos');
      }
    }

    const { event, data, apiVersion } = body;
    console.log(`[AbacatePay] Webhook recebido: ${event} (API v${apiVersion || 1})`);

    // Suporta 'billing.paid' (v1) e 'checkout.completed' (v2)
    if (event === 'billing.paid' || event === 'checkout.completed' || event === 'transparent.completed') {
      const checkout = data.checkout || data.billing || data.transparent;
      const customer = data.customer || checkout?.customer;

      if (!checkout) {
        console.error('[AbacatePay] ❌ Dados da cobrança não encontrados no payload.');
        return { received: true };
      }

      // Tenta extrair o userId de várias fontes possíveis (Metadata é o ideal)
      let userId =
        checkout.metadata?.userId ||
        data.metadata?.userId ||
        checkout.externalId;

      // Se ainda não temos o userId, tenta buscar no customer
      if (!userId && customer) {
        userId = customer.metadata?.userId || customer.externalId;
      }

      // Fallback para e-mail se nada funcionar
      if (!userId && customer?.email) {
        console.log(`[AbacatePay] userId ausente. Usando e-mail como identificador: ${customer.email}`);
        userId = customer.email;
      }

      const plan =
        checkout.metadata?.plan ||
        checkout.products?.[0]?.externalId?.replace('plan_', '') ||
        'premium';

      console.log(
        `[AbacatePay] Pagamento confirmado! User/ID: ${userId}, Plano: ${plan}`,
      );

      return {
        received: true,
        userId,
        plan: plan.toLowerCase() as PaymentPlan,
        status: 'PAID',
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
