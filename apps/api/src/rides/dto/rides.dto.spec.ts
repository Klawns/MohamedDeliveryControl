import {
  bulkDeleteRidesSchema,
  createRideSchema,
  updateRideSchema,
} from './rides.dto';
import { invalidRidePhotoReferenceMessage } from './ride-photo-reference.schema';

describe('rides dto photo contract', () => {
  const validPhotoKey =
    'users/user-1/rides/123e4567-e89b-42d3-a456-426614174000.webp';

  it('accepts and trims a controlled ride photo reference on create', () => {
    const parsed = createRideSchema.parse({
      clientId: 'client-1',
      value: 15,
      photo: ` ${validPhotoKey} `,
    });

    expect(parsed.photo).toBe(validPhotoKey);
  });

  it('normalizes an empty photo string to null on create', () => {
    const parsed = createRideSchema.parse({
      clientId: 'client-1',
      value: 15,
      photo: '   ',
    });

    expect(parsed.photo).toBeNull();
  });

  it('rejects a generic string photo on create', () => {
    try {
      createRideSchema.parse({
        clientId: 'client-1',
        value: 15,
        photo: 'https://legacy.example.com/photo.jpg',
      });
      fail('Expected createRideSchema.parse to throw for an invalid photo');
    } catch (error) {
      expect(error).toMatchObject({
        issues: [
          expect.objectContaining({
            path: ['photo'],
            message: invalidRidePhotoReferenceMessage,
          }),
        ],
      });
    }
  });

  it('allows photo omission on update to preserve the current value', () => {
    const parsed = updateRideSchema.parse({
      notes: 'Atualizada',
    });

    expect(parsed).toEqual({
      notes: 'Atualizada',
    });
  });

  it('accepts a controlled ride photo reference on update', () => {
    const parsed = updateRideSchema.parse({
      photo: validPhotoKey,
    });

    expect(parsed.photo).toBe(validPhotoKey);
  });
});

describe('rides dto bulk delete contract', () => {
  it('deduplicates and trims ride ids', () => {
    const parsed = bulkDeleteRidesSchema.parse({
      ids: [' ride-1 ', 'ride-2', 'ride-1'],
    });

    expect(parsed.ids).toEqual(['ride-1', 'ride-2']);
  });

  it('rejects empty payloads', () => {
    expect(() => bulkDeleteRidesSchema.parse({ ids: [] })).toThrow();
  });
});
