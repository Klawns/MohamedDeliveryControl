import { clients } from '@mdc/database';

export type Client = typeof clients.$inferSelect;
export type CreateClientDto = typeof clients.$inferInsert;
export interface ClientDirectoryEntry {
  id: string;
  name: string;
  isPinned: boolean;
}

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
    hasNextPage: boolean;
  }>;
  findDirectory(
    userId: string,
    search?: string,
    limit?: number,
  ): Promise<{
    clients: ClientDirectoryEntry[];
    returned: number;
    limit: number;
    hasMore: boolean;
    search?: string;
  }>;

  create(data: CreateClientDto, executor?: unknown): Promise<Client>;

  findOne(
    userId: string,
    id: string,
    executor?: unknown,
  ): Promise<Client | undefined>;
  findOneForUpdate(
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
  incrementBalance(
    userId: string,
    id: string,
    amount: number,
    executor?: unknown,
  ): Promise<Client | undefined>;
  decrementBalance(
    userId: string,
    id: string,
    amount: number,
    executor?: unknown,
  ): Promise<Client | undefined>;

  delete(userId: string, id: string, executor?: unknown): Promise<void>;
  findManyByIds(
    userId: string,
    ids: string[],
    executor?: unknown,
  ): Promise<Client[]>;
  deleteManyByIds(
    userId: string,
    ids: string[],
    executor?: unknown,
  ): Promise<Client[]>;
  deleteAll(userId: string): Promise<void>;
}
