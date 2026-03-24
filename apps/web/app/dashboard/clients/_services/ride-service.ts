import { api, apiClient } from "@/services/api";

export interface Ride {
    id: string;
    clientId: string;
    value: number;
    notes?: string;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    paymentStatus: 'PENDING' | 'PAID';
    rideDate?: string;
    createdAt: string;
}

export interface FetchClientRidesParams {
    limit: number;
    offset: number;
}

export interface FetchClientRidesResponse {
    rides: Ride[];
    total: number;
}

export const rideService = {
    async fetchClientRides(clientId: string, params: FetchClientRidesParams): Promise<FetchClientRidesResponse> {
        const queryParams = new URLSearchParams();
        queryParams.append("limit", params.limit.toString());
        queryParams.append("offset", params.offset.toString());

        const response = await apiClient.getPaginated<Ride[]>(`/rides/client/${clientId}?${queryParams.toString()}`);
        return {
            rides: response.data || [],
            total: response.meta?.total || 0,
        };
    },

    async deleteRide(rideId: string): Promise<void> {
        await apiClient.delete(`/rides/${rideId}`);
    },

    async fetchRidesForReport(clientId: string): Promise<Ride[]> {
        const response = await apiClient.getPaginated<Ride[]>(`/rides/client/${clientId}?limit=100`);
        return response.data || [];
    }
};
