import { Controller, Get, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { UsersService } from '../users/users.service';
import { IpAllowlistGuard } from '../common/guards/ip-allowlist.guard';
import { InternalApiKeyGuard } from '../common/guards/internal-api-key.guard';
import { ZodParam } from '../common/decorators/zod.decorator';
import type { User } from '../users/interfaces/users-repository.interface';

const debugEmailParamSchema = z.string().email('E-mail invalido');
const debugUserIdParamSchema = z.string().uuid('ID invalido');

@Controller('debug')
@UseGuards(IpAllowlistGuard, InternalApiKeyGuard)
@Throttle({ default: { limit: 10, ttl: 60000 } })
export class DebugController {
  constructor(private readonly usersService: UsersService) {}

  private sanitizeUser(user: User | undefined) {
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  @Get('user/:email')
  async findUser(@ZodParam('email', debugEmailParamSchema) email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { message: 'Usuario nao encontrado via e-mail' };
    }

    return this.sanitizeUser(user);
  }

  @Get('id/:id')
  async findUserById(@ZodParam('id', debugUserIdParamSchema) id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      return { message: 'Usuario nao encontrado via ID' };
    }

    return this.sanitizeUser(user);
  }
}
