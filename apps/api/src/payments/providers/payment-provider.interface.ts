export type PaymentPlan = 'starter' | 'premium' | 'lifetime';

export interface CustomerData {
  name?: string;
  email: string;
  taxId?: string;
  cellphone?: string;
}

export interface IPaymentProvider {
  createCheckoutSession(
    userId: string,
    plan: PaymentPlan,
    amount: number,
    customer?: CustomerData,
    coupons?: string[],
    planName?: string,
  ): Promise<{ url: string }>;
  handleWebhook(
    signature: string,
    payload: Buffer,
    query?: any,
  ): Promise<{
    received: boolean;
    userId?: string;
    plan?: PaymentPlan;
    status?: string;
    eventId: string;
  }>;
  listCoupons?(): Promise<any[]>;
  createCoupon?(data: any): Promise<any>;
  getRevenue?(startDate: string, endDate: string): Promise<{ total: number }>;
}

export const PAYMENT_PROVIDER = 'PAYMENT_PROVIDER';
