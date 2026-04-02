import { BadRequestException } from '@nestjs/common';
import { RideCursorService } from './ride-cursor.service';

describe('RideCursorService', () => {
  let service: RideCursorService;

  beforeEach(() => {
    service = new RideCursorService();
  });

  it('should encode and decode cursor payloads consistently', () => {
    const cursor = service.encode({
      id: 'ride-1',
      rideDate: new Date('2026-03-29T10:00:00.000Z'),
      createdAt: new Date('2026-03-29T11:00:00.000Z'),
    });

    expect(service.decode(cursor)).toEqual({
      id: 'ride-1',
      rideDate: '2026-03-29T10:00:00.000Z',
      createdAt: '2026-03-29T11:00:00.000Z',
    });
  });

  it('should reject malformed cursor payloads', () => {
    const invalidCursor = Buffer.from(
      JSON.stringify({ id: 'ride-1' }),
    ).toString('base64');

    expect(() => service.decode(invalidCursor)).toThrow(BadRequestException);
  });
});
