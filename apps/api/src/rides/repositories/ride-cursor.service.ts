import { BadRequestException, Injectable } from '@nestjs/common';
import { and, eq, lt, or } from 'drizzle-orm';

interface RideCursorPayload {
  rideDate: string;
  createdAt: string;
  id: string;
}

interface CursorItem {
  id: string;
  rideDate: Date | null;
  createdAt: Date | null;
}

@Injectable()
export class RideCursorService {
  decode(cursor: string): RideCursorPayload {
    try {
      const decodedString = Buffer.from(cursor, 'base64').toString('utf-8');
      const parsedCursor = JSON.parse(decodedString) as Partial<RideCursorPayload>;

      if (
        !parsedCursor.rideDate ||
        !parsedCursor.createdAt ||
        !parsedCursor.id
      ) {
        throw new Error('Invalid cursor payload structure');
      }

      const rideDate = new Date(parsedCursor.rideDate);
      const createdAt = new Date(parsedCursor.createdAt);

      if (Number.isNaN(rideDate.getTime()) || Number.isNaN(createdAt.getTime())) {
        throw new Error('Invalid cursor dates');
      }

      return {
        rideDate: rideDate.toISOString(),
        createdAt: createdAt.toISOString(),
        id: parsedCursor.id,
      };
    } catch {
      throw new BadRequestException('Parâmetro cursor inválido ou malformado.');
    }
  }

  encode(item: CursorItem): string {
    const payload: RideCursorPayload = {
      rideDate: item.rideDate?.toISOString() ?? new Date().toISOString(),
      createdAt: item.createdAt?.toISOString() ?? new Date().toISOString(),
      id: item.id,
    };

    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  buildCondition(ridesSchema: any, payload: RideCursorPayload) {
    const cursorRideDate = new Date(payload.rideDate);
    const cursorCreatedAt = new Date(payload.createdAt);

    return or(
      lt(ridesSchema.rideDate, cursorRideDate),
      and(
        eq(ridesSchema.rideDate, cursorRideDate),
        lt(ridesSchema.createdAt, cursorCreatedAt),
      ),
      and(
        eq(ridesSchema.rideDate, cursorRideDate),
        eq(ridesSchema.createdAt, cursorCreatedAt),
        lt(ridesSchema.id, payload.id),
      ),
    );
  }
}
