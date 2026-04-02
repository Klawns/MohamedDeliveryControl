import { clientsService } from '@/services/clients-service';
import type { ApiEnvelope } from '@/services/api';
import { ridesService } from '@/services/rides-service';
import { settingsService } from '@/services/settings-service';
import {
  Client,
  CreateRideDTO,
  CursorMeta,
  Ride,
  RidePreset,
  UpdateRideDTO,
} from '@/types/rides';

export const rideModalService = {
  async getClients(): Promise<ApiEnvelope<Client[], CursorMeta>> {
    return clientsService.getClients();
  },

  async getRidePresets(): Promise<RidePreset[]> {
    return settingsService.getRidePresets();
  },

  async createClient(name: string): Promise<Client> {
    return clientsService.createClient({ name });
  },

  async createRide(payload: CreateRideDTO): Promise<Ride> {
    return ridesService.createRide(payload);
  },

  async updateRide(id: string, payload: UpdateRideDTO): Promise<Ride> {
    return ridesService.updateRide(id, payload);
  },

  async getClientBalance(clientId: string): Promise<{ clientBalance: number }> {
    return clientsService.getClientBalance(clientId);
  },
};
