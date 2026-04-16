import { apiClient, type ApiEnvelope } from '@/services/api';
import {
  type ClientPayment,
  type ClientPaymentStatus,
  type CreateClientPaymentInput,
} from '@/types/client-payments';
import {
  type BulkDeleteClientsResult,
  type Client,
  type ClientBalance,
  type ClientDirectoryEntry,
  type CursorMeta,
} from '@/types/rides';

interface ClientPayload {
  name: string;
  phone?: string | null;
  address?: string | null;
}

export interface ClientDirectoryFilters {
  search?: string;
  limit?: number;
}

export interface ClientDirectoryMeta {
  returned: number;
  limit: number;
  hasMore: boolean;
  search?: string;
}

export interface CloseDebtResult {
  success: boolean;
  settledRides: number;
  generatedBalance: number;
}

function normalizeDate(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(0).toISOString();
}

function normalizeAmount(value: unknown) {
  return typeof value === 'number' ? value : Number(value ?? 0);
}

function normalizeStatus(value: unknown): ClientPaymentStatus {
  return value === 'USED' ? 'USED' : 'UNUSED';
}

function normalizeClientPayment(payload: unknown): ClientPayment {
  const source =
    payload && typeof payload === 'object'
      ? (payload as Record<string, unknown>)
      : {};

  return {
    id: typeof source.id === 'string' ? source.id : '',
    clientId: typeof source.clientId === 'string' ? source.clientId : '',
    userId: typeof source.userId === 'string' ? source.userId : undefined,
    amount: normalizeAmount(source.amount),
    paymentDate: normalizeDate(source.paymentDate),
    status: normalizeStatus(source.status),
    notes: typeof source.notes === 'string' ? source.notes : null,
    createdAt: normalizeDate(source.createdAt),
  };
}

export const clientsService = {
  async getClients(
    params?: {
      limit?: number;
      cursor?: string;
      search?: string;
    },
    signal?: AbortSignal,
  ): Promise<ApiEnvelope<Client[], CursorMeta>> {
    return apiClient.getPaginated<Client[], CursorMeta>('/clients', {
      params,
      signal,
    });
  },

  async getClientDirectory(
    params?: ClientDirectoryFilters,
    signal?: AbortSignal,
  ): Promise<ApiEnvelope<ClientDirectoryEntry[], ClientDirectoryMeta>> {
    return apiClient.getEnvelope<ClientDirectoryEntry[], ClientDirectoryMeta>(
      '/clients/directory',
      {
        params,
        signal,
      },
    );
  },

  async createClient(data: ClientPayload): Promise<Client> {
    return apiClient.post('/clients', data);
  },

  async getClient(clientId: string, signal?: AbortSignal): Promise<Client> {
    return apiClient.get(`/clients/${clientId}`, { signal });
  },

  async updateClient(clientId: string, data: ClientPayload): Promise<Client> {
    return apiClient.patch(`/clients/${clientId}`, data);
  },

  async getClientBalance(clientId: string, signal?: AbortSignal) {
    return apiClient.get<ClientBalance>(`/clients/${clientId}/balance`, {
      signal,
    });
  },

  async getClientPayments(
    clientId: string,
    signal?: AbortSignal,
    status?: ClientPaymentStatus,
  ): Promise<ClientPayment[]> {
    const data = await apiClient.get<unknown[]>(`/clients/${clientId}/payments`, {
      params: status ? { status } : undefined,
      signal,
    });

    return (data || []).map(normalizeClientPayment);
  },

  async addClientPayment(
    clientId: string,
    data: CreateClientPaymentInput,
  ): Promise<ClientPayment> {
    const payment = await apiClient.post<unknown>(
      `/clients/${clientId}/payments`,
      data,
    );

    return normalizeClientPayment(payment);
  },

  async deleteClient(clientId: string): Promise<void> {
    return apiClient.delete(`/clients/${clientId}`);
  },

  async deleteClients(ids: string[]): Promise<BulkDeleteClientsResult> {
    return apiClient.post('/clients/bulk-delete', { ids });
  },

  async deleteAllClients(): Promise<void> {
    return apiClient.delete('/clients/all');
  },

  async togglePin(clientId: string, isPinned: boolean): Promise<Client> {
    return apiClient.patch(`/clients/${clientId}`, { isPinned: !isPinned });
  },

  async closeDebt(clientId: string): Promise<CloseDebtResult> {
    return apiClient.post(`/clients/${clientId}/close-debt`);
  },
};

export default clientsService;
