import { api, apiClient } from "@/services/api";

export interface Client {
    id: string;
    name: string;
    userId: string;
    isPinned: boolean;
    createdAt: string;
}

export interface ClientBalance {
    totalDebt: number;
    totalPaid: number;
    remainingBalance: number;
}

export interface FetchClientsParams {
    limit: number;
    offset: number;
    search?: string;
}

export interface FetchClientsResponse {
    clients: Client[];
    total: number;
}

export const clientService = {
    async fetchClients(params: FetchClientsParams): Promise<FetchClientsResponse> {
        const queryParams = new URLSearchParams();
        queryParams.append("limit", params.limit.toString());
        queryParams.append("offset", params.offset.toString());
        if (params.search) queryParams.append("search", params.search);

        const response = await apiClient.getPaginated<Client[]>(`/clients?${queryParams.toString()}`);
        return {
            clients: response.data || [],
            total: response.meta?.total || 0,
        };
    },

    async fetchClientBalance(clientId: string): Promise<ClientBalance> {
        return apiClient.get<ClientBalance>(`/clients/${clientId}/balance`);
    },

    async fetchClientPayments(clientId: string): Promise<any[]> {
        const data = await apiClient.get<any[]>(`/clients/${clientId}/payments`);
        return data || [];
    },

    async deleteClient(clientId: string): Promise<void> {
        await apiClient.delete(`/clients/${clientId}`);
    },

    async togglePin(clientId: string, isPinned: boolean): Promise<void> {
        await apiClient.patch(`/clients/${clientId}`, { isPinned: !isPinned });
    },

    async closeDebt(clientId: string): Promise<void> {
        await apiClient.post(`/clients/${clientId}/close-debt`);
    }
};
