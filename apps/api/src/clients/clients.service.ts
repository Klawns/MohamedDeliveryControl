import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  IClientsRepository,
  CreateClientDto,
} from './interfaces/clients-repository.interface';
import { IClientPaymentsRepository } from './interfaces/client-payments-repository.interface';
import { IRidesRepository } from '../rides/interfaces/rides-repository.interface';

@Injectable()
export class ClientsService {
  constructor(
    @Inject(IClientsRepository)
    private readonly clientsRepository: IClientsRepository,
    @Inject(IClientPaymentsRepository)
    private readonly clientPaymentsRepository: IClientPaymentsRepository,
    @Inject(IRidesRepository)
    private readonly ridesRepository: IRidesRepository,
  ) {}

  async findAll(
    userId: string,
    limit?: number,
    cursor?: string,
    search?: string,
  ) {
    return this.clientsRepository.findAll(userId, limit, cursor, search);
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
    // 1. Get total pending debt and count from DB
    const { totalDebt, pendingRidesCount } = await this.ridesRepository.getPendingDebtStats(clientId, userId);

    // 2. Get total unused payments and count from DB
    const { totalPaid, unusedPaymentsCount } = await this.clientPaymentsRepository.getUnusedPaymentsStats(clientId, userId);

    // 3. Calculate remaining balance
    const remainingBalance = Math.max(0, totalDebt - totalPaid);

    return {
      totalDebt,
      totalPaid,
      remainingBalance,
      pendingRides: pendingRidesCount,
      unusedPayments: unusedPaymentsCount,
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
    // 1. Mark all pending as PAID in DB directly
    const settledCount = await this.ridesRepository.markAllAsPaidForClient(clientId, userId);

    // 2. Mark all unused partial payments as USED
    await this.clientPaymentsRepository.markAsUsed(clientId, userId);

    return { success: true, settledRides: settledCount };
  }

  async getClientPayments(
    userId: string,
    clientId: string,
    status?: 'UNUSED' | 'USED',
  ) {
    return this.clientPaymentsRepository.findByClient(clientId, userId, status);
  }
}
