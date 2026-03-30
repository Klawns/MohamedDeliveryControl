import { clients } from '@mdc/database';

export type Client = typeof clients.$inferSelect;
export type CreateClientDto = typeof clients.$inferInsert;

export const IClientsRepository = Symbol('IClientsRepository');

export interface IClientsRepository {
  findAll(
    userId: string,
    limit?: number,
    cursor?: string,
    search?: string,
  ): Promise<{
    clients: Client[];
    total: number;
    nextCursor?: string;
    hasMore: boolean;
  }>;

  create(data: CreateClientDto, executor?: unknown): Promise<Client>;

  findOne(
    userId: string,
    id: string,
    executor?: unknown,
  ): Promise<Client | undefined>;

  update(
    userId: string,
    id: string,
    data: Partial<CreateClientDto>,
    executor?: unknown,
  ): Promise<Client>;

  delete(userId: string, id: string, executor?: unknown): Promise<void>;
  deleteAll(userId: string): Promise<void>;
}
