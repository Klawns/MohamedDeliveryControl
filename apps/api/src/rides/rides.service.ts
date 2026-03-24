import { Injectable, Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { IRidesRepository } from './interfaces/rides-repository.interface';
import { AppLogger } from '../common/utils/logger.singleton';
import { getDatesFromPeriod } from '../common/utils/date.util';
import { CACHE_PROVIDER } from '../cache/interfaces/cache-provider.interface';
import type { ICacheProvider } from '../cache/interfaces/cache-provider.interface';
import { RideMapper } from './mappers/ride.mapper';
import type { CreateRideDto, UpdateRideDto, UpdateRideStatusDto, GetStatsDto } from './dto/rides.dto';

@Injectable()
export class RidesService {
  private readonly logger = AppLogger.getInstance();

  constructor(
    @Inject(IRidesRepository)
    private readonly ridesRepository: IRidesRepository,
    private subscriptionsService: SubscriptionsService,
    @Inject(CACHE_PROVIDER) private readonly cache: ICacheProvider,
  ) {}

  private async invalidateUserCache(userId: string) {
    const keys = [
      `stats:${userId}:today`,
      `stats:${userId}:week`,
      `stats:${userId}:month`,
      `stats:${userId}:year`,
      `frequent-clients:${userId}`
    ];
    
    // Explicitly delete known keys instead of wildcard for performance and control
    await Promise.all(keys.map(key => this.cache.del(key)));
    this.logger.debug(`[RidesService] Cache iterativo invalidado para usuário ${userId}`, 'RidesService');
  }

  async findAll(
    userId: string,
    limit: number = 20,
    cursor?: string,
    filters?: {
      status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
      paymentStatus?: 'PENDING' | 'PAID';
      clientId?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
    },
  ) {
    const parsedFilters = {
      ...filters,
      startDate: filters?.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters?.endDate ? new Date(filters.endDate) : undefined,
    };

    return this.ridesRepository.findAll(userId, limit, cursor, parsedFilters);
  }

  async create(
    userId: string,
    data: CreateRideDto,
  ) {
    this.logger.log(`[RidesService] Criando corrida para usuário ${userId}`, 'RidesService');

    const sub = await this.subscriptionsService.findByUserId(userId);

    if (!sub) {
      this.logger.warn(`[RidesService] Plano não encontrado para usuário ${userId}`, 'RidesService');
      throw new ForbiddenException('Plano não encontrado.');
    }

    if (sub.plan === 'starter' && sub.rideCount >= 20) {
      this.logger.warn(`[RidesService] Limite de corridas atingido para usuário ${userId}`, 'RidesService');
      throw new ForbiddenException(
        'Limite de 20 corridas do plano gratuito atingido. Faça o upgrade para continuar.',
      );
    }

    const result = await this.ridesRepository.create({
      id: randomUUID(),
      clientId: data.clientId,
      value: data.value,
      location: data.location,
      notes: data.notes,
      status: data.status || 'COMPLETED',
      paymentStatus: data.paymentStatus || 'PAID',
      rideDate: data.rideDate ? new Date(data.rideDate) : new Date(),
      photo: data.photo,
      userId,
    });

    if (result) {
      await this.subscriptionsService.incrementRideCount(userId);
      await this.invalidateUserCache(userId);
      this.logger.log(`[RidesService] Corrida ${result.id} criada com sucesso`, 'RidesService');
    }

    return result;
  }

  async update(
    userId: string,
    id: string,
    data: UpdateRideDto,
  ) {
    this.logger.log(`[RidesService] Atualizando corrida ${id}`, 'RidesService');

    const updateData: any = { ...data };
    
    if (data.rideDate !== undefined) {
      updateData.rideDate = !data.rideDate ? null : new Date(data.rideDate);
    }

    const result = await this.ridesRepository.update(userId, id, updateData);

    if (!result) {
      throw new NotFoundException('Corrida não encontrada.');
    }

    await this.invalidateUserCache(userId);
    this.logger.log(`[RidesService] Corrida ${id} atualizada com sucesso`, 'RidesService');
    return result;
  }

  async delete(userId: string, id: string) {
    this.logger.log(`[RidesService] Removendo corrida ${id}`, 'RidesService');
    const result = await this.ridesRepository.delete(userId, id);

    if (result) {
      await this.subscriptionsService.decrementRideCount(userId);
      await this.invalidateUserCache(userId);
      this.logger.log(`[RidesService] Corrida ${id} removida com sucesso`, 'RidesService');
    } else {
      throw new NotFoundException('Corrida não encontrada.');
    }

    return result;
  }

  async updateStatus(
    userId: string,
    id: string,
    data: UpdateRideStatusDto,
  ) {
    const result = await this.ridesRepository.updateStatus(userId, id, data);
    if (result) await this.invalidateUserCache(userId);
    return result;
  }

  async getFrequentClients(userId: string) {
    const cacheKey = `frequent-clients:${userId}`;
    const cached = await this.cache.get<any>(cacheKey);
    
    if (cached) {
      this.logger.debug(`[RidesService] CACHE HIT: ${cacheKey}`, 'RidesService');
      return cached;
    }
    
    this.logger.debug(`[RidesService] CACHE MISS: ${cacheKey}. Buscando no DB...`, 'RidesService');
    const result = await this.ridesRepository.getFrequentClients(userId);
    
    // TTL: 1800 seconds = 30 minutes
    await this.cache.set(cacheKey, result, 1800);
    return result;
  }

  async countAll(userId: string) {
    return this.ridesRepository.countAll(userId);
  }

  async findByClient(
    userId: string,
    clientId: string,
    limit: number = 20,
    cursor?: string,
  ) {
    return this.ridesRepository.findByClient(userId, clientId, limit, cursor);
  }

  async getStats(userId: string, query: GetStatsDto) {
    // Only apply cache for fixed periods and no specific client filters
    const isCacheable = query.period !== 'custom' && !query.clientId;
    const cacheKey = `stats:${userId}:${query.period}`;

    if (isCacheable) {
      const cached = await this.cache.get<any>(cacheKey);
      if (cached) {
        this.logger.debug(`[RidesService] CACHE HIT: ${cacheKey}`, 'RidesService');
        return cached;
      }
      this.logger.debug(`[RidesService] CACHE MISS: ${cacheKey}. Buscando no DB e Mapeando...`, 'RidesService');
    }

    const { startDate, endDate } = getDatesFromPeriod(query.period, query.start, query.end);
    const dbResult = await this.ridesRepository.getStats(userId, startDate, endDate, query.clientId);
    
    const mappedResult = {
      count: dbResult.count,
      totalValue: dbResult.totalValue,
      rides: RideMapper.toHttpList(dbResult.rides),
    };

    if (isCacheable) {
      // TTL: 300 seconds = 5 minutes
      await this.cache.set(cacheKey, mappedResult, 300);
    }

    return mappedResult;
  }
}
