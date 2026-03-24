import type { Ride, RideWithClient } from '../interfaces/rides-repository.interface';
import type { RideResponseDto } from '../dto/ride-response.dto';

export class RideMapper {
  /**
   * Transforms a domain/database entity into an API Response DTO.
   * Strips out internal fields like userId, updatedAt, deletedAt.
   */
  static toHttp(entity: Ride | RideWithClient): RideResponseDto {
    const isWithClient = 'client' in entity;
    
    return {
      id: entity.id,
      value: entity.value,
      location: entity.location ?? null,
      notes: entity.notes ?? null,
      photo: entity.photo ?? null,
      status: entity.status as any, // Type cast is safe here as DB enum matches DTO enum
      paymentStatus: entity.paymentStatus as any,
      rideDate: entity.rideDate ? new Date(entity.rideDate) : null,
      createdAt: new Date(entity.createdAt),
      client: isWithClient && entity.client ? {
        id: entity.client.id,
        name: entity.client.name,
      } : null,
    };
  }

  /**
   * Transforms a list of domain/database entities into a list of API Response DTOs.
   */
  static toHttpList(entities: (Ride | RideWithClient)[]): RideResponseDto[] {
    return entities.map((entity) => RideMapper.toHttp(entity));
  }
}
