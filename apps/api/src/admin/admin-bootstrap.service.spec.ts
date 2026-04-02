/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/unbound-method -- This spec intentionally uses partial mocks and inspects jest mock calls directly. */
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

import { type ICacheProvider } from '../cache/interfaces/cache-provider.interface';
import { AdminBootstrapService } from './admin-bootstrap.service';
import { type IAdminSettingsRepository } from './interfaces/admin-settings-repository.interface';

describe('AdminBootstrapService', () => {
  const createConfigService = (values: Record<string, string | undefined>) =>
    ({
      get: (key: string) => values[key],
    }) as ConfigService;

  const createService = (values: Record<string, string | undefined>) => {
    const usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    const adminSettingsRepository: jest.Mocked<IAdminSettingsRepository> = {
      getPlans: jest.fn(),
      updatePlan: jest.fn(),
      getConfigs: jest.fn(),
      updateConfig: jest.fn(),
      seedInitialData: jest.fn(),
    };
    const cache: jest.Mocked<ICacheProvider> = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn().mockResolvedValue(undefined),
      getDel: jest.fn(),
      invalidatePrefix: jest.fn(),
    };

    const service = new AdminBootstrapService(
      createConfigService(values),
      usersService as any,
      adminSettingsRepository,
      cache,
    );

    return { service, usersService, adminSettingsRepository, cache };
  };

  it('creates the bootstrap admin when missing', async () => {
    const { service, usersService, adminSettingsRepository, cache } =
      createService({
        ADMIN_BOOTSTRAP_EMAIL: 'admin_rotta@gmail.com',
        ADMIN_BOOTSTRAP_PASSWORD: 'senha-forte-123',
      });

    usersService.findByEmail.mockResolvedValue(undefined);

    await service.run('cli');

    expect(adminSettingsRepository.seedInitialData).toHaveBeenCalledTimes(1);
    expect(cache.del).toHaveBeenCalledWith('pricing:all_plans');
    expect(usersService.create).toHaveBeenCalledTimes(1);

    const createPayload = usersService.create.mock.calls[0][0];
    expect(createPayload.email).toBe('admin_rotta@gmail.com');
    expect(createPayload.role).toBe('admin');
    await expect(
      bcrypt.compare('senha-forte-123', createPayload.password),
    ).resolves.toBe(true);
  });

  it('promotes an existing user to admin without overwriting password', async () => {
    const { service, usersService, adminSettingsRepository, cache } =
      createService({
        ADMIN_BOOTSTRAP_EMAIL: 'admin_rotta@gmail.com',
        ADMIN_BOOTSTRAP_PASSWORD: 'senha-forte-123',
      });

    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      displayId: 1,
      name: 'Rotta',
      email: 'admin_rotta@gmail.com',
      password: 'existing-hash',
      taxId: null,
      cellphone: null,
      role: 'user',
      hasSeenTutorial: false,
      createdAt: new Date(),
    });

    await service.run('cli');

    expect(adminSettingsRepository.seedInitialData).toHaveBeenCalledTimes(1);
    expect(usersService.update).toHaveBeenCalledWith('user-1', {
      role: 'admin',
    });
    expect(cache.del).toHaveBeenNthCalledWith(1, 'pricing:all_plans');
    expect(cache.del).toHaveBeenNthCalledWith(2, 'profile:user-1');
  });

  it('skips when bootstrap credentials are absent', async () => {
    const { service, usersService, adminSettingsRepository, cache } =
      createService({});

    await service.run('cli');

    expect(adminSettingsRepository.seedInitialData).toHaveBeenCalledTimes(1);
    expect(cache.del).toHaveBeenCalledWith('pricing:all_plans');
    expect(usersService.findByEmail).not.toHaveBeenCalled();
    expect(usersService.create).not.toHaveBeenCalled();
    expect(usersService.update).not.toHaveBeenCalled();
  });
});
