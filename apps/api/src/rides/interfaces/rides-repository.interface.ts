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
    cursor?: string,
    filters?: FindAllFilters,
  ): Promise<{
    rides: RideWithClient[];
    total: number;
    nextCursor?: string;
    hasMore: boolean;
  }>;

  create(data: CreateRideDto, executor?: unknown): Promise<Ride>;

  findOne(
    userId: string,
    id: string,
    executor?: unknown,
  ): Promise<Ride | undefined>;

  updateStatus(
    userId: string,
    id: string,
    data: {
      status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
      paymentStatus?: 'PENDING' | 'PAID';
      debtValue?: number;
    },
    executor?: unknown,
  ): Promise<Ride>;

  getFrequentClients(
    userId: string,
  ): Promise<Array<{ id: string; name: string; isPinned: boolean }>>;

  update(
    userId: string,
    id: string,
    data: UpdateRideDto,
    executor?: unknown,
  ): Promise<Ride>;

  countAll(userId: string): Promise<number>;

  delete(userId: string, id: string, executor?: unknown): Promise<Ride | undefined>;

  findByClient(
    userId: string,
    clientId: string,
    limit?: number,
    cursor?: string,
  ): Promise<{
    rides: Ride[];
    total: number;
    nextCursor?: string;
    hasMore: boolean;
  }>;

  getStats(
    userId: string,
    start: Date,
    end: Date,
    clientId?: string,
  ): Promise<{ count: number; totalValue: number; rides: RideWithClient[] }>;

  getPendingDebtStats(
    clientId: string,
    userId: string,
    executor?: unknown,
  ): Promise<{ totalDebt: number; pendingRidesCount: number }>;

  markAllAsPaidForClient(
    clientId: string,
    userId: string,
    executor?: unknown,
  ): Promise<number>;
  deleteAll(userId: string, executor?: unknown): Promise<void>;
}
