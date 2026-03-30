/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Drizzle is consumed through a dialect-agnostic runtime boundary in this repository. */
import { Injectable, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

import { DRIZZLE } from '../../database/database.provider';
import type { DrizzleClient } from '../../database/database.provider';
import {
  ISettingsRepository,
  RidePreset,
  CreateRidePresetDto,
  UpdateRidePresetDto,
} from '../interfaces/settings-repository.interface';

@Injectable()
export class DrizzleSettingsRepository implements ISettingsRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly drizzle: DrizzleClient,
  ) {}

  private get db() {
    return this.drizzle.db;
  }

  private get schema() {
    return this.drizzle.schema;
  }

  getRidePresets(userId: string): Promise<RidePreset[]> {
    return this.db
      .select()
      .from(this.schema.ridePresets)
      .where(eq(this.schema.ridePresets.userId, userId));
  }

  async createRidePreset(
    data: Omit<CreateRidePresetDto, 'id'> & { id?: string },
  ): Promise<RidePreset> {
    const results = await this.db
      .insert(this.schema.ridePresets)
      .values({
        userId: data.userId,
        label: data.label,
        value: data.value,
        location: data.location,
        id: data.id || randomUUID(),
      } as any)
      .returning();

    return results[0];
  }

  async deleteRidePreset(userId: string, id: string): Promise<void> {
    await this.db
      .delete(this.schema.ridePresets)
      .where(
        and(
          eq(this.schema.ridePresets.id, id),
          eq(this.schema.ridePresets.userId, userId),
        ),
      );
  }

  updateRidePreset(
    userId: string,
    id: string,
    data: UpdateRidePresetDto,
  ): Promise<RidePreset[]> {
    const updatePayload: Partial<
      Pick<RidePreset, 'label' | 'value' | 'location'>
    > = {};

    if (data.label !== undefined) {
      updatePayload.label = data.label;
    }

    if (data.value !== undefined) {
      updatePayload.value = data.value;
    }

    if (data.location !== undefined) {
      updatePayload.location = data.location;
    }

    return this.db
      .update(this.schema.ridePresets)
      .set(updatePayload as any)
      .where(
        and(
          eq(this.schema.ridePresets.id, id),
          eq(this.schema.ridePresets.userId, userId),
        ),
      )
      .returning();
  }
}
