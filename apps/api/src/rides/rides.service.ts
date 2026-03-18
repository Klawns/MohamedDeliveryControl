import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { IRidesRepository } from './interfaces/rides-repository.interface';

@Injectable()
export class RidesService {
  constructor(
    @Inject(IRidesRepository)
    private readonly ridesRepository: IRidesRepository,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async findAll(
    userId: string,
    limit?: number,
    offset?: number,
    filters?: {
      status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
      paymentStatus?: 'PENDING' | 'PAID';
      clientId?: string;
      startDate?: Date;
      endDate?: Date;
      search?: string;
    },
  ) {
    return this.ridesRepository.findAll(userId, limit, offset, filters);
  }

  async create(
    userId: string,
    data: {
      clientId: string;
      value: number;
      location: string;
      notes?: string;
      status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
      paymentStatus?: 'PENDING' | 'PAID';
      rideDate?: Date;
      photo?: string;
    },
  ) {
    const sub = await this.subscriptionsService.findByUserId(userId);

    if (!sub) {
      throw new ForbiddenException('Plano não encontrado.');
    }

    if (sub.plan === 'starter') {
      if (sub.rideCount >= 20) {
        throw new ForbiddenException(
          'Limite de 20 corridas do plano gratuito atingido. Faça o upgrade para continuar.',
        );
      }
    }

    const result = await this.ridesRepository.create({
      id: randomUUID(),
      clientId: data.clientId,
      value: data.value,
      location: data.location,
      notes: data.notes,
      status: data.status || 'COMPLETED',
      paymentStatus: data.paymentStatus || 'PAID',
      rideDate: data.rideDate || new Date(),
      photo: data.photo,
      userId,
    });

    if (result) {
      await this.subscriptionsService.incrementRideCount(userId);
    }

    return result;
  }

  async updateStatus(
    userId: string,
    id: string,
    data: {
      status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
      paymentStatus?: 'PENDING' | 'PAID';
    },
  ) {
    return this.ridesRepository.updateStatus(userId, id, data);
  }

  async getFrequentClients(userId: string) {
    return this.ridesRepository.getFrequentClients(userId);
  }

  async update(
    userId: string,
    id: string,
    data: {
      value?: number;
      location?: string;
      notes?: string;
      status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
      paymentStatus?: 'PENDING' | 'PAID';
      rideDate?: Date;
      photo?: string;
    },
  ) {
    return this.ridesRepository.update(userId, id, data);
  }

  async countAll(userId: string) {
    return this.ridesRepository.countAll(userId);
  }

  async delete(userId: string, id: string) {
    const result = await this.ridesRepository.delete(userId, id);

    if (result) {
      await this.subscriptionsService.decrementRideCount(userId);
    }

    return result;
  }

  async findByClient(
    userId: string,
    clientId: string,
    limit?: number,
    offset?: number,
  ) {
    return this.ridesRepository.findByClient(userId, clientId, limit, offset);
  }

  async getStats(userId: string, start: Date, end: Date, clientId?: string) {
    return this.ridesRepository.getStats(userId, start, end, clientId);
  }
}
