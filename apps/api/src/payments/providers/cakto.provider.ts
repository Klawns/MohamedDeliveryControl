import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IPaymentProvider,
  PaymentPlan,
  CustomerData,
} from './payment-provider.interface';
import axios from 'axios';

interface CaktoTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

@Injectable()
export class CaktoProvider implements IPaymentProvider {
  private readonly logger = new Logger(CaktoProvider.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl = 'https://api.cakto.com.br';
  private readonly publicApiUrl = 'https://api.cakto.com.br/public_api';

  private accessToken?: string;
  private tokenExpiresAt?: number;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('CAKTO_CLIENT_ID') || '';
    this.clientSecret =
      this.configService.get<string>('CAKTO_CLIENT_SECRET') || '';

    if (!this.clientId || !this.clientSecret) {
      this.logger.error(
        'Cakto credentials (CLIENT_ID/SECRET) not found in environment!',
      );
    }
  }

  private async getAccessToken(): Promise<string> {
    if (
      this.accessToken &&
      this.tokenExpiresAt &&
      Date.now() < this.tokenExpiresAt
    ) {
      return this.accessToken;
    }

    try {
      const response = await axios.post<CaktoTokenResponse>(
        `${this.publicApiUrl}/token/`,
        new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.accessToken = response.data.access_token;
      // Expire 1 minute early to be safe
      this.tokenExpiresAt = Date.now() + (response.data.expires_in - 60) * 1000;

      return this.accessToken;
    } catch (error) {
      this.handleError('Error obtaining Cakto access token', error);
    }
  }

  private async getHeaders() {
    const token = await this.getAccessToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private async getOrCreateProductId(): Promise<string> {
    const envProductId = this.configService.get<string>('CAKTO_PRODUCT_ID');
    if (envProductId) {
      this.logger.log(`Using CAKTO_PRODUCT_ID from env: ${envProductId}`);
      return envProductId;
    }

    const projectName =
      this.configService.get<string>('CAKTO_PROJECT_NAME') || 'ROTTA';

    try {
      // 1. Check if product already exists
      const productsRes = await axios.get(`${this.publicApiUrl}/products/`, {
        params: { search: projectName },
        headers: await this.getHeaders(),
      });

      const existingProduct = productsRes.data.results?.find(
        (p: any) => p.name === projectName || p.name.includes(projectName),
      );
      if (existingProduct) {
        this.logger.log(
          `Found existing product: ${existingProduct.name} (${existingProduct.id})`,
        );
        return existingProduct.id;
      }

      // 2. Cannot create product via API in Cakto
      throw new InternalServerErrorException(
        `Produto '${projectName}' não foi encontrado na sua conta Cakto. ` +
          `Você precisa criar um produto com este nome no Painel da Cakto, ou definir a variável CAKTO_PRODUCT_ID no .env com o ID do seu produto.`,
      );
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      this.handleError('Error managing Cakto product', error);
    }
  }

  private async getOrCreateOfferId(
    productId: string,
    plan: PaymentPlan,
    planName: string,
    amount: number,
  ): Promise<string> {
    const offerName = `Plano ${planName}`;
    // A Cakto exige um valor mínimo de R$ 5,00 para criar a oferta
    const priceInCakto = Math.max(amount / 100, 5.00);

    try {
      // 1. Check if offer already exists for this price and plan
      const offersRes = await axios.get(`${this.publicApiUrl}/offers/`, {
        params: { search: offerName },
        headers: await this.getHeaders(),
      });

      const existingOffer = offersRes.data.results?.find(
        (o: any) =>
          o.name === offerName &&
          o.product === productId &&
          Math.abs(Number(o.price) - priceInCakto) < 0.01,
      );

      if (existingOffer) return existingOffer.id;

      // 2. Create if not found
      this.logger.log(`Offer "${offerName}" not found. Creating in Cakto...`);
      const createRes = await axios.post(
        `${this.publicApiUrl}/offers/`,
        {
          name: offerName,
          price: priceInCakto,
          product: productId,
          status: 'active',
          type: 'unique',
        },
        { headers: await this.getHeaders() },
      );
      return createRes.data.id;
    } catch (error) {
      this.handleError('Error managing Cakto offer', error);
    }
  }

  async createCheckoutSession(
    userId: string,
    plan: PaymentPlan,
    amount: number,
    customer?: CustomerData,
    coupons?: string[],
    planName?: string,
  ): Promise<{ url: string }> {
    if (plan === 'starter' || amount === 0) {
      throw new InternalServerErrorException(
        'O plano gratuito não requer pagamento.',
      );
    }

    try {
      const productId = await this.getOrCreateProductId();
      const offerId = await this.getOrCreateOfferId(productId, plan, planName || plan.toUpperCase(), amount);

      const checkoutBaseUrl = `https://pay.cakto.com.br/${offerId}`;
      const url = new URL(checkoutBaseUrl);
      url.searchParams.append('utm_content', userId);
      url.searchParams.append('src', userId);

      if (customer) {
        if (customer.name) url.searchParams.append('name', customer.name);
        if (customer.email) url.searchParams.append('email', customer.email);
        if (customer.taxId)
          url.searchParams.append(
            'document',
            customer.taxId.replace(/\D/g, ''),
          );
        if (customer.cellphone) {
          let phoneRaw = customer.cellphone.replace(/\D/g, '');
          if (phoneRaw && !phoneRaw.startsWith('55')) {
            phoneRaw = `55${phoneRaw}`;
          }
          url.searchParams.append('phone', phoneRaw);
        }
      }

      if (coupons && coupons.length > 0) {
        url.searchParams.append('coupon', coupons[0]);
      }

      return { url: url.toString() };
    } catch (error) {
      this.handleError('Error creating Cakto checkout session', error);
    }
  }

  async handleWebhook(signature: string, payload: Buffer, query?: any) {
    let body: any;
    try {
      body = JSON.parse(payload.toString());
    } catch (e: any) {
      this.logger.error('Error parsing Cakto webhook payload:', e.message);
      return { received: true };
    }

    const { event, data } = body;
    this.logger.log(`Webhook received: ${event?.custom_id || event}`);

    // purchase_approved is the main event we care about
    if (
      event?.custom_id === 'purchase_approved' ||
      event === 'purchase_approved'
    ) {
      // Cakto might send userId in tracking parameters if we passed it in the checkout URL
      // We look for utm_content or src which we set in createCheckoutSession
      const tracking = data?.tracking || body?.tracking || {};
      const userId =
        tracking.utm_content ||
        tracking.src ||
        query?.utm_content ||
        query?.src;

      const offerName = data?.offer?.name || '';
      let plan: PaymentPlan = 'premium';

      if (offerName.toLowerCase().includes('lifetime')) {
        plan = 'lifetime';
      }

      if (!userId) {
        this.logger.error(
          'Critical failure: Could not find userId in Cakto webhook payload/tracking',
        );
        // If we can't find the user, we try fallback to email if available
        const email = data?.customer?.email;
        if (email) {
          return {
            received: true,
            userId: email, // PaymentsService handles email to userId resolution
            plan,
            status: 'PAID',
            eventId: body.id?.toString(),
          };
        }
        return { received: true };
      }

      return {
        received: true,
        userId,
        plan,
        status: 'PAID',
        eventId: body.id?.toString(),
      };
    }

    return { received: true };
  }

  private handleError(context: string, error: any): never {
    const errorData = error.response?.data;
    this.logger.error(`${context}:`, {
      message: error.message,
      status: error.response?.status,
      data: errorData,
    });

    throw new InternalServerErrorException("Erro de comunicação com o gateway de pagamento. Tente novamente mais tarde.");
  }
}
