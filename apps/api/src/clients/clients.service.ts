import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  IClientsRepository,
  CreateClientDto,
} from './interfaces/clients-repository.interface';
import { IClientPaymentsRepository } from './interfaces/client-payments-repository.interface';
import { RidesService } from '../rides/rides.service';

@Injectable()
export class ClientsService {
  constructor(
    @Inject(IClientsRepository)
    private readonly clientsRepository: IClientsRepository,
    @Inject(IClientPaymentsRepository)
    private readonly clientPaymentsRepository: IClientPaymentsRepository,
    @Inject(forwardRef(() => RidesService))
    private readonly ridesService: RidesService,
  ) {}

  async findAll(
    userId: string,
    limit?: number,
    offset?: number,
    search?: string,
  ) {
    return this.clientsRepository.findAll(userId, limit, offset, search);
  }

  async create(userId: string, data: { name: string }) {
    return this.clientsRepository.create({
      userId,
      name: data.name,
    } as CreateClientDto);
  }

  async findOne(userId: string, id: string) {
    return this.clientsRepository.findOne(userId, id);
  }

  async update(userId: string, id: string, data: Partial<CreateClientDto>) {
    return this.clientsRepository.update(userId, id, data);
  }

  async delete(userId: string, id: string) {
    return this.clientsRepository.delete(userId, id);
  }

  async getClientBalance(userId: string, clientId: string) {
    // 1. Get all pending rides for the client
    const { rides } = await this.ridesService.findByClient(userId, clientId);
    const pendingRides = rides.filter(
      (r) => r.paymentStatus === 'PENDING' && r.status !== 'CANCELLED',
    );
    const totalDebt = pendingRides.reduce((sum, r) => sum + r.value, 0);

    // 2. Get all unused partial payments
    const payments = await this.clientPaymentsRepository.findByClient(
      clientId,
      userId,
      'UNUSED',
    );
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    // 3. Calculate remaining balance
    const remainingBalance = Math.max(0, totalDebt - totalPaid);

    return {
      totalDebt,
      totalPaid,
      remainingBalance,
      pendingRides: pendingRides.length,
      unusedPayments: payments.length,
    };
  }

  async addPartialPayment(
    userId: string,
    clientId: string,
    amount: number,
    notes?: string,
  ) {
    return this.clientPaymentsRepository.create({
      id: randomUUID(),
      clientId,
      userId,
      amount,
      notes,
    });
  }

  async closeDebt(userId: string, clientId: string) {
    // 1. Find all pending rides
    const { rides } = await this.ridesService.findByClient(userId, clientId);
    const pendingRides = rides.filter(
      (r) => r.paymentStatus === 'PENDING' && r.status !== 'CANCELLED',
    );

    // 2. Mark them as PAID
    for (const ride of pendingRides) {
      await this.ridesService.updateStatus(userId, ride.id, {
        paymentStatus: 'PAID',
      });
    }

    // 3. Mark all unused partial payments as USED
    await this.clientPaymentsRepository.markAsUsed(clientId, userId);

    return { success: true, settledRides: pendingRides.length };
  }

  async getClientPayments(
    userId: string,
    clientId: string,
    status?: 'UNUSED' | 'USED',
  ) {
    return this.clientPaymentsRepository.findByClient(clientId, userId, status);
  }
}
