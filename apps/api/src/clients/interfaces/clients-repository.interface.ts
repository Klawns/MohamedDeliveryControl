import { clients } from '@mdc/database';

export type Client = typeof clients.$inferSelect;
export type CreateClientDto = typeof clients.$inferInsert;

export const IClientsRepository = Symbol('IClientsRepository');

export interface IClientsRepository {
  findAll(
    userId: string,
    limit?: number,
    offset?: number,
    search?: string,
  ): Promise<{ clients: Client[]; total: number }>;

  create(data: CreateClientDto): Promise<Client>;

  findOne(userId: string, id: string): Promise<Client | undefined>;

  update(
    userId: string,
    id: string,
    data: Partial<CreateClientDto>,
  ): Promise<Client>;

  delete(userId: string, id: string): Promise<void>;
}
