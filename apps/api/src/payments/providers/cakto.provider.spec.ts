import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CaktoProvider } from './cakto.provider';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CaktoProvider', () => {
  let provider: CaktoProvider;

  const mockClientId = 'test-client-id';
  const mockClientSecret = 'test-client-secret';
  const mockAccessToken = 'test-access-token';
  const mockProductId = 'test-product-id';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaktoProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'CAKTO_CLIENT_ID') return mockClientId;
              if (key === 'CAKTO_CLIENT_SECRET') return mockClientSecret;
              if (key === 'CAKTO_PROJECT_NAME') return 'ROTTA';
              return null;
            }),
          },
        },
      ],
    }).compile();

    provider = module.get<CaktoProvider>(CaktoProvider);
    jest.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    it("should create product and offer if they don't exist", async () => {
      // 1. OAuth Token
      mockedAxios.post.mockResolvedValueOnce({
        data: { access_token: mockAccessToken, expires_in: 3600 },
      });

      // 2. Search Product (empty results)
      mockedAxios.get.mockResolvedValueOnce({
        data: { results: [] },
      });

      // 3. Create Product
      mockedAxios.post.mockResolvedValueOnce({
        data: { id: 'new-product-id' },
      });

      // 4. Search Offer (empty results)
      mockedAxios.get.mockResolvedValueOnce({
        data: { results: [] },
      });

      // 5. Create Offer
      mockedAxios.post.mockResolvedValueOnce({
        data: { id: 'new-offer-id' },
      });

      const result = await provider.createCheckoutSession(
        'user-1',
        'premium',
        5000,
      );

      expect(result.url).toContain('new-offer-id');
      expect(mockedAxios.post).toHaveBeenCalledTimes(3); // token + product + offer
      expect(mockedAxios.get).toHaveBeenCalledTimes(2); // search product + search offer
    });

    it('should reuse existing product and offer', async () => {
      // 1. OAuth Token
      mockedAxios.post.mockResolvedValueOnce({
        data: { access_token: mockAccessToken, expires_in: 3600 },
      });

      // 2. Search Product (found)
      mockedAxios.get.mockResolvedValueOnce({
        data: { results: [{ id: 'existing-p-id', name: 'ROTTA' }] },
      });

      // 3. Search Offer (found)
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          results: [
            {
              id: 'existing-o-id',
              name: 'Plano ROTTA - PREMIUM',
              price: 50,
              product: 'existing-p-id',
            },
          ],
        },
      });

      const result = await provider.createCheckoutSession(
        'user-2',
        'premium',
        5000,
      );

      expect(result.url).toContain('existing-o-id');
      expect(mockedAxios.post).toHaveBeenCalledTimes(1); // token only
      expect(mockedAxios.get).toHaveBeenCalledTimes(2); // search product + search offer
    });

    it('should create a new offer if the price has changed (promotion)', async () => {
      // 1. OAuth Token
      mockedAxios.post.mockResolvedValueOnce({
        data: { access_token: mockAccessToken, expires_in: 3600 },
      });

      // 2. Search Product (found)
      mockedAxios.get.mockResolvedValueOnce({
        data: { results: [{ id: 'existing-p-id', name: 'ROTTA' }] },
      });

      // 3. Search Offer (found but with DIFFERENT price)
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          results: [
            {
              id: 'old-offer-id',
              name: 'Plano ROTTA - PREMIUM',
              price: 40, // Old price
              product: 'existing-p-id',
            },
          ],
        },
      });

      // 4. Create new Offer for new price (50)
      mockedAxios.post.mockResolvedValueOnce({
        data: { id: 'promo-offer-id' },
      });

      const result = await provider.createCheckoutSession(
        'user-3',
        'premium',
        5000,
      );

      expect(result.url).toContain('promo-offer-id');
      expect(mockedAxios.post).toHaveBeenCalledTimes(2); // token + new offer create
    });
  });

  describe('handleWebhook', () => {
    it('should parse purchase_approved event correctly', async () => {
      const payload = Buffer.from(
        JSON.stringify({
          event: 'purchase_approved',
          data: {
            offer: { name: 'Plano ROTTA - PREMIUM' },
            tracking: { utm_content: 'user-123' },
          },
          id: 'evt-123',
        }),
      );

      const result = await provider.handleWebhook('sig', payload);

      expect(result).toEqual({
        received: true,
        userId: 'user-123',
        plan: 'premium',
        status: 'PAID',
        eventId: 'evt-123',
      });
    });

    it('should identify lifetime plan in webhook', async () => {
      const payload = Buffer.from(
        JSON.stringify({
          event: 'purchase_approved',
          data: {
            offer: { name: 'Plano ROTTA - LIFETIME' },
            tracking: { utm_content: 'user-456' },
          },
          id: 'evt-456',
        }),
      );

      const result = await provider.handleWebhook('sig', payload);

      expect(result.plan).toBe('lifetime');
    });
  });
});
