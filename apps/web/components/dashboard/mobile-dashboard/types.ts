import { Ride } from "@/types/rides";
export type { Ride };
export type { Client, RidePreset, PaymentStatus, RideStatus } from "@/types/rides";

export interface DashboardStats {
    count: number;
    totalValue: number;
    rides: Ride[];
}

export interface MobileDashboardProps {
    onRideCreated: () => void;
}
