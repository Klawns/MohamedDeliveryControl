import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PaymentsController } from '../src/payments/payments.controller';
import { PaymentsService } from '../src/payments/payments.service';
import { UsersService } from '../src/users/users.service';
import { IPaymentsRepository } from '../src/payments/interfaces/payments-repository.interface';
import { CACHE_PROVIDER } from '../src/cache/interfaces/cache-provider.interface';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { PAYMENT_PROVIDER } from '../src/payments/providers/payment-provider.interface';
import { CaktoProvider } from '../src/payments/providers/cakto.provider';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getQueueToken } from '@nestjs/bullmq';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PaymentsController (Cakto Integration)', () => {
  let app: INestApplication;

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        PaymentsService,
        CaktoProvider,
        {
          provide: PAYMENT_PROVIDER,
          useClass: CaktoProvider,
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn().mockResolvedValue(mockUser),
            findByEmail: jest.fn().mockResolvedValue(mockUser),
          },
        },
        {
          provide: IPaymentsRepository,
          useValue: {
            getPlanById: jest
              .fn()
              .mockResolvedValue({ id: 'premium', price: 5000 }),
            getAllPlans: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: CACHE_PROVIDER,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: { [key: string]: string } = {
                CAKTO_CLIENT_ID: 'cid',
                CAKTO_CLIENT_SECRET: 'csec',
                CAKTO_PRODUCT_ID: '', // Force automated creation
                PAYMENT_GATEWAY: 'cakto',
              };
              return config[key];
            }),
          },
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
        {
          provide: getQueueToken('webhooks'),
          useValue: { add: jest.fn() },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
    // Simulate req.user population normally done by Passport
    app.use((req: any, res: any, next: any) => {
      req.user = mockUser;
      next();
    });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /payments/checkout', () => {
    it('should return a Cakto checkout URL', async () => {
      // 1. Token
      mockedAxios.post.mockResolvedValueOnce({
        data: { access_token: 'token', expires_in: 3600 },
      });
      // 2. Search Product (not found)
      mockedAxios.get.mockResolvedValueOnce({ data: { results: [] } });
      // 3. Create Product
      mockedAxios.post.mockResolvedValueOnce({ data: { id: 'prod-123' } });
      // 4. Search Offer (not found)
      mockedAxios.get.mockResolvedValueOnce({ data: { results: [] } });
      // 5. Create Offer
      mockedAxios.post.mockResolvedValueOnce({ data: { id: 'offer-123' } });

      const response = await request(app.getHttpServer())
        .post('/payments/checkout')
        .send({ plan: 'premium' })
        .expect(201);

      expect(response.body.url).toContain('pay.cakto.com.br/offer-123');
      expect(response.body.url).toContain('utm_content=user-1');
    });
  });

  describe('POST /payments/webhook', () => {
    it('should process approved payment', async () => {
      const payload = {
        event: 'purchase_approved',
        data: {
          offer: { name: 'Plano ROTTA - PREMIUM' },
          tracking: { utm_content: 'user-1' },
        },
        id: 'evt-123',
      };

      await request(app.getHttpServer())
        .post('/payments/webhook')
        .set('x-signature', 'any-sig')
        .send(payload)
        .expect(201);
    });
  });
});
