import { rides, clients } from '@mdc/database';

export type Ride = typeof rides.$inferSelect;
export type CreateRideDto = typeof rides.$inferInsert;
export type UpdateRideDto = Partial<CreateRideDto>;
export type Client = typeof clients.$inferSelect;

export interface FindAllFilters {
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  paymentStatus?: 'PENDING' | 'PAID';
  clientId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface RideWithClient extends Omit<Ride, 'clientId' | 'userId'> {
  client: {
    id: string;
    name: string;
  } | null;
}

export const IRidesRepository = Symbol('IRidesRepository');

export interface IRidesRepository {
  findAll(
    userId: string,
    limit?: number,
    offset?: number,
    filters?: FindAllFilters,
  ): Promise<{ rides: RideWithClient[]; total: number }>;

  create(data: CreateRideDto): Promise<Ride>;

  updateStatus(
    userId: string,
    id: string,
    data: {
      status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
      paymentStatus?: 'PENDING' | 'PAID';
    },
  ): Promise<Ride>;

  getFrequentClients(
    userId: string,
  ): Promise<Array<{ id: string; name: string; isPinned: boolean }>>;

  update(userId: string, id: string, data: UpdateRideDto): Promise<Ride>;

  countAll(userId: string): Promise<number>;

  delete(userId: string, id: string): Promise<Ride | undefined>;

  findByClient(
    userId: string,
    clientId: string,
    limit?: number,
    offset?: number,
  ): Promise<{ rides: Ride[]; total: number }>;

  getStats(
    userId: string,
    start: Date,
    end: Date,
    clientId?: string,
  ): Promise<{ count: number; totalValue: number; rides: RideWithClient[] }>;

  getPendingDebtStats(clientId: string, userId: string): Promise<{ totalDebt: number; pendingRidesCount: number }>;

  markAllAsPaidForClient(clientId: string, userId: string): Promise<number>;
}
