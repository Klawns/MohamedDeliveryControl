"use client";

import type { ChangeEvent } from "react";
import type { PaymentStatus, RideViewModel } from "@/types/rides";

export type ValueSelectionMode = "picker" | "custom-edit" | "summary";

export interface RideFormState {
    selectedPresetId: string | null;
    customValue: string;
    customLocation: string;
    valueSelectionMode: ValueSelectionMode;
    paymentStatus: PaymentStatus;
    rideDate: string;
    notes: string;
    photo: string | null;
    isSaving: boolean;
    canSubmit: boolean;
    isValueSelectionComplete: boolean;
}

export interface RideFormActions {
    setCustomValue: (value: string) => void;
    setCustomLocation: (location: string) => void;
    setPaymentStatus: (status: PaymentStatus) => void;
    setRideDate: (date: string) => void;
    setNotes: (notes: string) => void;
    handlePresetSelect: (id: string, value: number, location?: string) => void;
    startCustomValueEntry: () => void;
    confirmCustomValue: () => void;
    resetValueSelection: () => void;
    handlePhotoChange: (event: ChangeEvent<HTMLInputElement>) => void;
    removePhoto: () => void;
    submitRide: () => Promise<void>;
    resetForm: () => void;
}

export interface RideRegistrationModals {
    rideToEdit: RideViewModel | null;
    setRideToEdit: (ride: RideViewModel | null) => void;
    rideToDelete: RideViewModel | null;
    setRideToDelete: (ride: RideViewModel | null) => void;
    isDeleting: boolean;
    handleDeleteRide: () => Promise<void>;
}
