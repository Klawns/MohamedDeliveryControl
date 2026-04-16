import { ApiEnvelope, apiClient } from '@/services/api';
import {
  CreateRideDTO,
  CursorMeta,
  FrequentClient,
  BulkDeleteRidesResult,
  RideViewModel,
  RidesParams,
  UpdateRideDTO,
} from '@/types/rides';
import { RidesMapper } from './rides-mapper';
import {
  parseRideResponseDTO,
  parseRideResponseDTOList,
  parseRideStatsPayload,
} from './rides-response';

export interface RideStatsResponse {
  count: number;
  totalValue: number;
  rides: RideViewModel[];
}

interface RideStatsMeta extends Record<string, unknown> {
  count?: number;
  totalValue?: number;
}

export const ridesService = {
  async getRides(
    params: RidesParams,
    signal?: AbortSignal,
  ): Promise<ApiEnvelope<RideViewModel[], CursorMeta>> {
    const response = await apiClient.getPaginated<unknown, CursorMeta>(
      '/rides',
      { params, signal },
    );

    return {
      data: RidesMapper.toViewModelList(
        parseRideResponseDTOList(response.data, 'rides list'),
      ),
      meta: response.meta,
    };
  },

  async getStats(
    params: {
      period: string;
      start?: string;
      end?: string;
      clientId?: string;
    },
    signal?: AbortSignal,
  ): Promise<ApiEnvelope<RideStatsResponse>> {
    const response = await apiClient.getPaginated<unknown, RideStatsMeta>(
      '/rides/stats',
      { params, signal },
    );
    const stats = parseRideStatsPayload(response.data, response.meta, 'rides stats');

    return {
      data: {
        count: stats.count,
        totalValue: stats.totalValue,
        rides: RidesMapper.toViewModelList(stats.rides),
      },
      meta: response.meta,
    };
  },

  async getFrequentClients(signal?: AbortSignal): Promise<FrequentClient[]> {
    return apiClient.get('/rides/frequent-clients', { signal });
  },

  async createRide(ride: CreateRideDTO): Promise<RideViewModel> {
    const data = await apiClient.post<unknown>('/rides', ride);
    return RidesMapper.toViewModelFromDTO(parseRideResponseDTO(data, 'create ride'));
  },

  async updateRide(id: string, ride: UpdateRideDTO): Promise<RideViewModel> {
    const cleanedPayload = Object.fromEntries(
      Object.entries(ride).filter(([, value]) => value !== undefined),
    );

    const data = await apiClient.patch<unknown>(
      `/rides/${id}`,
      cleanedPayload,
    );
    return RidesMapper.toViewModelFromDTO(parseRideResponseDTO(data, 'update ride'));
  },

  async updateRideStatus(
    id: string,
    dataPayload: { status?: string; paymentStatus?: string },
  ): Promise<RideViewModel> {
    const data = await apiClient.patch<unknown>(
      `/rides/${id}/status`,
      dataPayload,
    );
    return RidesMapper.toViewModelFromDTO(
      parseRideResponseDTO(data, 'update ride status'),
    );
  },

  async deleteRide(id: string): Promise<void> {
    return apiClient.delete(`/rides/${id}`);
  },

  async deleteRides(ids: string[]): Promise<BulkDeleteRidesResult> {
    return apiClient.post('/rides/bulk-delete', { ids });
  },

  async deleteAllRides(): Promise<void> {
    return apiClient.delete('/rides/all');
  },

  async getRidesCount(signal?: AbortSignal): Promise<{ count: number }> {
    return apiClient.get('/rides/count', { signal });
  },

  async getRidesByClient(
    clientId: string,
    params?: {
      limit?: number;
      cursor?: string;
      status?: string;
      paymentStatus?: string;
      startDate?: string;
      endDate?: string;
    },
    signal?: AbortSignal,
  ): Promise<ApiEnvelope<RideViewModel[], CursorMeta>> {
    const response = await apiClient.getPaginated<unknown, CursorMeta>(
      `/rides/client/${clientId}`,
      { params, signal },
    );

    return {
      data: RidesMapper.toViewModelList(
        parseRideResponseDTOList(response.data, 'rides by client list'),
      ),
      meta: response.meta,
    };
  },
};

export default ridesService;
