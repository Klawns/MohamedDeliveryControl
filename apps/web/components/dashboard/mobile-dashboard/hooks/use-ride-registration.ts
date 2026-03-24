"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { uploadImage } from "@/lib/upload";
import { ridesService } from "@/services/rides-service";
import { toISOFromLocalInput } from "@/lib/date-utils";
import { parseApiError } from "@/lib/api-error";
import { Client, Ride, PaymentStatus, RideStatus } from "@/types/rides";

interface RideRegistrationProps {
    onSuccess: () => void;
}

export function useRideRegistration({ onSuccess }: RideRegistrationProps) {
    const { toast } = useToast();
    
    // Form State
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
    const [customValue, setCustomValue] = useState("");
    const [customLocation, setCustomLocation] = useState("");
    const [showCustomForm, setShowCustomForm] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PAID');
    const [rideDate, setRideDate] = useState("");
    const [notes, setNotes] = useState("");
    const [photo, setPhoto] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Temp state for editing/deleting
    const [rideToEdit, setRideToEdit] = useState<Ride | null>(null);
    const [isRideModalOpen, setIsRideModalOpen] = useState(false);
    const [rideToDelete, setRideToDelete] = useState<Ride | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const resetForm = useCallback(() => {
        setSelectedClient(null);
        setSelectedPresetId(null);
        setShowCustomForm(false);
        setCustomValue("");
        setCustomLocation("");
        setRideDate("");
        setNotes("");
        setPhoto(null);
    }, []);

    const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhoto(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const handleConfirmRide = useCallback(async () => {
        if (!selectedClient) return;

        let finalValue = Number(customValue);
        let finalLocation = customLocation || "";

        if (!finalValue) {
            toast({ title: "Selecione um valor", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            let uploadedPhotoUrl = photo;

            if (photo && photo.startsWith('data:image')) {
                try {
                    const response = await fetch(photo);
                    const blob = await response.blob();
                    const file = new File([blob], "ride-photo.jpg", { type: blob.type });
                    const res = await uploadImage(file, 'rides');
                    uploadedPhotoUrl = res.url;
                } catch (uploadErr) {
                    console.error("[RideRegistration] Erro no upload R2:", uploadErr);
                    uploadedPhotoUrl = null;
                }
            }

            await ridesService.createRide({
                clientId: selectedClient.id,
                value: finalValue,
                location: finalLocation,
                notes: notes || undefined,
                photo: uploadedPhotoUrl || undefined,
                status: 'COMPLETED' as RideStatus,
                paymentStatus: paymentStatus,
                rideDate: rideDate ? toISOFromLocalInput(rideDate) : undefined
            });

            toast({ 
                title: "Corrida registrada!", 
                description: `R$ ${finalValue.toFixed(2)} para ${selectedClient.name}` 
            });

            resetForm();
            onSuccess();
        } catch (err) {
            toast({ title: parseApiError(err, "Erro ao registrar"), variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }, [selectedClient, customValue, customLocation, photo, notes, paymentStatus, rideDate, toast, resetForm, onSuccess]);

    const handleDeleteRide = useCallback(async () => {
        if (!rideToDelete) return;
        setIsDeleting(true);
        try {
            await ridesService.deleteRide(rideToDelete.id);
            toast({ title: "Corrida excluída" });
            onSuccess();
            setRideToDelete(null);
        } catch (err) {
            toast({ title: parseApiError(err, "Erro ao excluir"), variant: "destructive" });
        } finally {
            setIsDeleting(false);
        }
    }, [rideToDelete, toast, onSuccess]);

    return {
        // State
        selectedClient, setSelectedClient,
        selectedPresetId, setSelectedPresetId,
        customValue, setCustomValue,
        customLocation, setCustomLocation,
        showCustomForm, setShowCustomForm,
        paymentStatus, setPaymentStatus,
        rideDate, setRideDate,
        notes, setNotes,
        photo, setPhoto,
        isSaving,
        
        // Modals
        rideToEdit, setRideToEdit,
        isRideModalOpen, setIsRideModalOpen,
        rideToDelete, setRideToDelete,
        isDeleting,
        
        // Handlers
        handlePhotoChange,
        handleConfirmRide,
        handleDeleteRide,
        resetForm
    };
}
