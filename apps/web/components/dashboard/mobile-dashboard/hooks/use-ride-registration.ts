"use client";

import { useMemo } from "react";
import type { Client } from "@/types/rides";
import type {
    RideFormActions,
    RideFormState,
    RideRegistrationModals,
} from "./ride-registration.types";
import { useRideDialogs } from "./use-ride-dialogs";
import { useRideFormState } from "./use-ride-form-state";
import { useRideSubmit } from "./use-ride-submit";

interface RideRegistrationProps {
    selectedClient: Client | null;
    onSelectionReset: () => void;
    onSuccess: () => void | Promise<void>;
}

export type { RideFormActions, RideFormState, RideRegistrationModals };

export function useRideRegistration({
    selectedClient,
    onSelectionReset,
    onSuccess,
}: RideRegistrationProps) {
    const formState = useRideFormState({
        onReset: onSelectionReset,
    });
    const submitRide = useRideSubmit({
        selectedClient,
        customValue: formState.fields.customValue,
        customLocation: formState.fields.customLocation,
        paymentStatus: formState.fields.paymentStatus,
        rideDate: formState.fields.rideDate,
        notes: formState.fields.notes,
        photo: formState.fields.photo,
        resetForm: formState.helpers.resetForm,
        onSuccess,
    });
    const modals = useRideDialogs({ onSuccess });

    const form = useMemo<RideFormState>(
        () => ({
            selectedPresetId: formState.fields.selectedPresetId,
            customValue: formState.fields.customValue,
            customLocation: formState.fields.customLocation,
            valueSelectionMode: formState.fields.valueSelectionMode,
            paymentStatus: formState.fields.paymentStatus,
            rideDate: formState.fields.rideDate,
            notes: formState.fields.notes,
            photo: formState.fields.photo,
            isSaving: submitRide.isSubmitting,
            canSubmit:
                !!selectedClient &&
                formState.fields.valueSelectionMode === "summary" &&
                !!formState.fields.customValue,
            isValueSelectionComplete:
                formState.fields.valueSelectionMode === "summary" &&
                !!formState.fields.customValue,
        }),
        [
            formState.fields.customLocation,
            formState.fields.customValue,
            formState.fields.notes,
            formState.fields.paymentStatus,
            formState.fields.photo,
            formState.fields.rideDate,
            formState.fields.selectedPresetId,
            formState.fields.valueSelectionMode,
            selectedClient,
            submitRide.isSubmitting,
        ],
    );

    const actions: RideFormActions = {
        setCustomValue: formState.setters.setCustomValue,
        setCustomLocation: formState.setters.setCustomLocation,
        setPaymentStatus: formState.setters.setPaymentStatus,
        setRideDate: formState.setters.setRideDate,
        setNotes: formState.setters.setNotes,
        handlePresetSelect: formState.helpers.handlePresetSelect,
        startCustomValueEntry: formState.helpers.startCustomValueEntry,
        confirmCustomValue: formState.helpers.confirmCustomValue,
        resetValueSelection: formState.helpers.resetValueSelection,
        handlePhotoChange: formState.helpers.handlePhotoChange,
        removePhoto: () => formState.setters.setPhoto(null),
        submitRide: submitRide.submitRide,
        resetForm: formState.helpers.resetForm,
    };

    return {
        form,
        actions,
        modals: modals as RideRegistrationModals,
    };
}
