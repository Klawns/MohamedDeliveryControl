"use client";

import { useCallback, useState, type ChangeEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import {
    getUploadImageValidationError,
    readFileAsDataUrl,
} from "@/lib/upload-image";
import type { PaymentStatus } from "@/types/rides";
import type { ValueSelectionMode } from "./ride-registration.types";

interface UseRideFormStateProps {
    onReset?: () => void;
}

export function useRideFormState({ onReset }: UseRideFormStateProps = {}) {
    const { toast } = useToast();
    const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
    const [customValue, setCustomValue] = useState("");
    const [customLocation, setCustomLocation] = useState("");
    const [valueSelectionMode, setValueSelectionMode] =
        useState<ValueSelectionMode>("picker");
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("PAID");
    const [rideDate, setRideDate] = useState("");
    const [notes, setNotes] = useState("");
    const [photo, setPhoto] = useState<string | null>(null);

    const resetForm = useCallback(() => {
        setSelectedPresetId(null);
        setValueSelectionMode("picker");
        setCustomValue("");
        setCustomLocation("");
        setRideDate("");
        setNotes("");
        setPhoto(null);
        onReset?.();
    }, [onReset]);

    const handlePresetSelect = useCallback((id: string, value: number, location?: string) => {
        setSelectedPresetId(id);
        setCustomValue(String(value));
        if (location) {
            setCustomLocation(location);
        }
        setValueSelectionMode("summary");
    }, []);

    const startCustomValueEntry = useCallback(() => {
        setSelectedPresetId(null);
        setCustomValue("");
        setValueSelectionMode("custom-edit");
    }, []);

    const confirmCustomValue = useCallback(() => {
        const parsedValue = Number(customValue);

        if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
            return;
        }

        setSelectedPresetId(null);
        setValueSelectionMode("summary");
    }, [customValue]);

    const resetValueSelection = useCallback(() => {
        setSelectedPresetId(null);
        setCustomValue("");
        setValueSelectionMode("picker");
    }, []);

    const handlePhotoChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        const input = event.currentTarget;

        if (!file) {
            return;
        }

        const validationError = getUploadImageValidationError(file);

        if (validationError) {
            input.value = "";
            toast({
                title: validationError,
                variant: "destructive",
            });
            return;
        }

        void readFileAsDataUrl(file)
            .then((result) => {
                setPhoto(result);
            })
            .catch((error: unknown) => {
                toast({
                    title:
                        error instanceof Error
                            ? error.message
                            : "Nao foi possivel ler a imagem selecionada.",
                    variant: "destructive",
                });
            })
            .finally(() => {
                input.value = "";
            });
    }, [toast]);

    return {
        fields: {
            selectedPresetId,
            customValue,
            customLocation,
            valueSelectionMode,
            paymentStatus,
            rideDate,
            notes,
            photo,
        },
        setters: {
            setCustomValue,
            setCustomLocation,
            setPaymentStatus,
            setRideDate,
            setNotes,
            setPhoto,
        },
        helpers: {
            resetForm,
            handlePresetSelect,
            startCustomValueEntry,
            confirmCustomValue,
            resetValueSelection,
            handlePhotoChange,
        },
    };
}
