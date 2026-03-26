import type { Client } from '../interfaces/clients-repository.interface';

export interface ClientResponseDto {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  isPinned: boolean;
  balance: number;
  createdAt: Date;
}

export class ClientMapper {
  static toHttp(entity: Client): ClientResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      phone: entity.phone ?? null,
      address: entity.address ?? null,
      isPinned: !!entity.isPinned,
      balance: entity.balance ?? 0,
      createdAt: new Date(entity.createdAt),
    };
  }

  static toHttpList(entities: Client[]): ClientResponseDto[] {
    return entities.map((entity) => ClientMapper.toHttp(entity));
  }
}
