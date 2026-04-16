// ===========================
// Status & Enums
// ===========================
export type RideStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID';
export type RidePaymentFilter = 'all' | PaymentStatus;
export type RidePeriodPreset = 'today' | '7d' | '30d' | 'month' | 'custom';

// ===========================
// Entities
// ===========================
export interface Client {
    id: string;
    name: string;
    phone?: string | null;
    address?: string | null;
    isPinned?: boolean;
    balance?: number;
    createdAt?: string;
}

export interface ClientDirectoryEntry {
    id: string;
    name: string;
    isPinned: boolean;
}

export interface ClientBalance {
    totalDebt: number;
    totalPaid: number;
    remainingBalance: number;
    pendingRides: number;
    unusedPayments: number;
    clientBalance: number;
}

export interface FrequentClient extends Client {
    isPinned: boolean;
}


// ===========================
// Ride Response (API → Frontend)
// ===========================
export interface RideClientDTO {
    id: string;
    name: string;
}

export interface RideResponseDTO {
    id: string;
    value: number;
    notes?: string | null;
    status: RideStatus;
    paymentStatus: PaymentStatus;
    rideDate: string;
    createdAt: string;
    paidWithBalance?: number | null;
    debtValue?: number | null;
    location?: string | null;
    photo?: string | null;
    client: RideClientDTO | null;
}

export interface RideDomainModel {
    id: string;
    value: number;
    notes: string | null;
    status: RideStatus;
    paymentStatus: PaymentStatus;
    rideDate: string;
    createdAt: string;
    paidWithBalance?: number;
    debtValue?: number;
    location: string | null;
    photo: string | null;
    client: RideClientDTO | null;
}

export interface RideViewModel {
    id: string;
    value: number;
    notes: string | null;
    status: RideStatus;
    paymentStatus: PaymentStatus;
    rideDate: string;
    createdAt: string;
    paidWithBalance?: number;
    debtValue?: number;
    location: string | null;
    photo: string | null;
    client: RideClientDTO | null;
    clientId: string | null;
    clientName: string;
    paid: boolean;
}

export type Ride = RideViewModel;

// ===========================
// Ride Mutation Payloads (Frontend → API)
// ===========================
export interface CreateRideDTO {
    clientId: string;
    value: number;
    location: string;
    notes?: string | null;
    photo?: string | null;
    status: RideStatus;
    paymentStatus: PaymentStatus;
    rideDate?: string | null;
    useBalance?: boolean;
}

export type UpdateRideDTO = Partial<CreateRideDTO>;

export interface BulkDeleteRidesResult {
    requestedCount: number;
    deletedCount: number;
}

export interface BulkDeleteClientsResult {
    requestedCount: number;
    deletedCount: number;
}

// ===========================
// Filters & Pagination
// ===========================
export interface RidesFilterState {
    search: string;
    paymentFilter: RidePaymentFilter;
    clientId: string | null;
    clientName: string | null;
    periodPreset: RidePeriodPreset | null;
    startDate: string;
    endDate: string;
}

export interface RidesParams {
    limit: number;
    cursor?: string;
    status?: string;
    paymentStatus?: string;
    clientId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
}

export interface InfinitePaginatedResponse<T> {
    items: T[];
    nextCursor?: string;
    hasNextPage: boolean;
}

export interface CursorMeta {
    total?: number;
    nextCursor?: string;
    hasNextPage?: boolean;
}

// ===========================
// UI Props
// ===========================
export interface RideModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    clientId?: string;
    clientName?: string;
    rideToEdit?: RideViewModel | null;
}

export interface RideFormData {
    selectedClientId: string;
    value: string;
    location: string;
    notes: string;
    photo: string | null;
    rideDate: string;
    paymentStatus: PaymentStatus;
    isCustomValue: boolean;
}
export type { RidePreset } from './settings';
