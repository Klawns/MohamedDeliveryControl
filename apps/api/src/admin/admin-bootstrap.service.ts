import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { CACHE_PROVIDER } from '../cache/interfaces/cache-provider.interface';
import type { ICacheProvider } from '../cache/interfaces/cache-provider.interface';
import { UsersService } from '../users/users.service';
import { IAdminSettingsRepository } from './interfaces/admin-settings-repository.interface';
import type { IAdminSettingsRepository as IAdminSettingsRepositoryType } from './interfaces/admin-settings-repository.interface';

@Injectable()
export class AdminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminBootstrapService.name);
  private hasRun = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    @Inject(IAdminSettingsRepository)
    private readonly adminSettingsRepository: IAdminSettingsRepositoryType,
    @Inject(CACHE_PROVIDER)
    private readonly cache: ICacheProvider,
  ) {}

  async onApplicationBootstrap() {
    await this.run('startup');
  }

  async run(source: 'startup' | 'cli' = 'startup') {
    if (this.hasRun) {
      return;
    }

    this.hasRun = true;

    await this.adminSettingsRepository.seedInitialData();
    await this.cache.del('pricing:all_plans');

    const email = this.configService
      .get<string>('ADMIN_BOOTSTRAP_EMAIL')
      ?.trim()
      .toLowerCase();
    const password = this.configService.get<string>('ADMIN_BOOTSTRAP_PASSWORD');

    if (!email || !password) {
      this.logger.log(`[${source}] Admin bootstrap skipped.`);
      return;
    }

    const existingUser = await this.usersService.findByEmail(email);

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(password, 10);

      await this.usersService.create({
        name: 'Admin Rotta',
        email,
        password: hashedPassword,
        role: 'admin',
      });

      this.logger.log(`[${source}] Bootstrap admin created for ${email}.`);
      return;
    }

    const updates: Record<string, unknown> = {};

    if (existingUser.role !== 'admin') {
      updates.role = 'admin';
    }

    if (!existingUser.password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    if (!existingUser.name?.trim()) {
      updates.name = 'Admin Rotta';
    }

    if (Object.keys(updates).length === 0) {
      this.logger.log(`[${source}] Bootstrap admin already present for ${email}.`);
      return;
    }

    await this.usersService.update(existingUser.id, updates);
    await this.cache.del(`profile:${existingUser.id}`);

    this.logger.log(
      `[${source}] Bootstrap admin updated for ${email} (${Object.keys(updates).join(', ')}).`,
    );
  }
}
