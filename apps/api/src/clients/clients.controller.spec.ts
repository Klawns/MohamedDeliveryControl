import { Test, TestingModule } from '@nestjs/testing';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

describe('ClientsController', () => {
  let controller: ClientsController;
  const clientsServiceMock = {
    findDirectory: jest.fn(),
    bulkDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [
        { provide: ClientsService, useValue: clientsServiceMock },
        {
          provide: SubscriptionsService,
          useValue: {
            getAccessSnapshot: jest
              .fn()
              .mockResolvedValue({ status: 'active' }),
          },
        },
      ],
    }).compile();

    controller = module.get<ClientsController>(ClientsController);
    clientsServiceMock.findDirectory.mockReset();
    clientsServiceMock.bulkDelete.mockReset();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should map client directory responses using the client mapper', async () => {
    clientsServiceMock.findDirectory.mockResolvedValue({
      clients: [{ id: 'client-1', name: 'Alice', isPinned: true }],
      returned: 1,
      limit: 20,
      hasMore: false,
      search: 'Ali',
    });

    const result = await controller.findDirectory(
      { user: { id: 'user-1' } } as any,
      { search: 'Ali', limit: 20 },
    );

    expect(clientsServiceMock.findDirectory).toHaveBeenCalledWith(
      'user-1',
      'Ali',
      20,
    );
    expect(result).toEqual({
      data: [{ id: 'client-1', name: 'Alice', isPinned: true }],
      meta: {
        returned: 1,
        limit: 20,
        hasMore: false,
        search: 'Ali',
      },
    });
  });

  it('should forward bulk deletion requests to the service', async () => {
    clientsServiceMock.bulkDelete.mockResolvedValue({
      requestedCount: 2,
      deletedCount: 2,
    });

    const result = await controller.bulkDelete(
      { user: { id: 'user-1' } } as any,
      { ids: ['client-1', 'client-2'] },
    );

    expect(clientsServiceMock.bulkDelete).toHaveBeenCalledWith('user-1', {
      ids: ['client-1', 'client-2'],
    });
    expect(result).toEqual({
      requestedCount: 2,
      deletedCount: 2,
    });
  });
});
