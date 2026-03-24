"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadImage } from "@/lib/upload";
import { useAuth } from "@/hooks/use-auth";
import { toLocalInputValue, toISOFromLocalInput } from "@/lib/date-utils";
import { parseApiError } from "@/lib/api-error";
import { Client, RidePreset, PaymentStatus, RideStatus, RideModalProps } from "@/types/rides";
import { rideModalService } from "../services/ride-modal-service";
import { toast } from "sonner";

export function useRideForm({ isOpen, onClose, onSuccess, clientId, rideToEdit }: Partial<RideModalProps>) {
    const { verify, user } = useAuth();
    const queryClient = useQueryClient();
    
    // Queries para dados iniciais
    const { data: clientsData, isLoading: isLoadingClients } = useQuery({
        queryKey: ["clients"],
        queryFn: () => rideModalService.getClients(),
        enabled: isOpen && !!user && !clientId,
    });

    const { data: presets = [], isLoading: isLoadingPresets } = useQuery({
        queryKey: ["ride-presets"],
        queryFn: () => rideModalService.getRidePresets(),
        enabled: isOpen && !!user,
    });

    const clients = useMemo(() => clientsData?.clients || [], [clientsData]);
    const isLoadingData = isLoadingClients || isLoadingPresets;
    
    // Form states
    const [selectedClientId, setSelectedClientId] = useState(clientId || "");
    const [value, setValue] = useState<string>("");
    const [location, setLocation] = useState("");
    const [notes, setNotes] = useState("");
    const [photo, setPhoto] = useState<string | null>(null);
    const [rideDate, setRideDate] = useState("");
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("PAID");
    const [isCustomValue, setIsCustomValue] = useState(false);
    
    // UI Phase states
    const [currentStep, setCurrentStep] = useState(1);
    
    // Client creation states
    const [newClientName, setNewClientName] = useState("");
    const [isCreatingClient, setIsCreatingClient] = useState(false);
    // clientPage e clientsPerPage removidos

    const resetForm = useCallback(() => {
        setSelectedClientId(clientId || "");
        setValue("");
        setLocation("");
        setNotes("");
        setRideDate("");
        setIsCustomValue(false);
        setPhoto(null);
        setPaymentStatus("PAID");
        setCurrentStep(clientId ? 2 : 1);
    }, [clientId]);

    useEffect(() => {
        if (isOpen && user) {
            if (rideToEdit) {
                setSelectedClientId(rideToEdit.clientId || rideToEdit.client?.id || "");
                setValue(rideToEdit.value.toString());
                setLocation(rideToEdit.location || "");
                setNotes(rideToEdit.notes || "");
                setRideDate(toLocalInputValue(rideToEdit.rideDate || ""));
                setPaymentStatus(rideToEdit.paymentStatus || "PAID");
                setPhoto(rideToEdit.photo || null);
                setIsCustomValue(true);
                setCurrentStep(2);
            } else {
                resetForm();
            }
        }
    }, [isOpen, clientId, rideToEdit, user, resetForm]);

    const handleCreateClient = async () => {
        if (!newClientName) return;
        setIsCreatingClient(true);
        try {
            const data = await rideModalService.createClient(newClientName);
            // Invalida a query de clientes para que a lista seja atualizada
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            setSelectedClientId(data.id);
            setNewClientName("");
            setIsCreatingClient(false);
            setCurrentStep(2);
            toast.success("Cliente cadastrado com sucesso");
        } catch (err) {
            toast.error(parseApiError(err, "Erro ao cadastrar cliente. Tente novamente."));
            setIsCreatingClient(false);
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhoto(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Mutação para salvar a corrida (Create ou Update)
    const { mutateAsync: saveRide, isPending: isSubmitting } = useMutation({
        mutationFn: async () => {
            let uploadedPhotoUrl = photo;

            if (photo && photo.startsWith('data:image')) {
                try {
                    const response = await fetch(photo);
                    const blob = await response.blob();
                    const file = new File([blob], "ride-photo.jpg", { type: blob.type });

                    const uploadRes = await uploadImage(file, 'rides');
                    uploadedPhotoUrl = uploadRes.url;
                } catch (uploadErr) {
                    console.error("Falha ao subir imagem para o R2, continuando sem foto...", uploadErr);
                    uploadedPhotoUrl = null;
                }
            }

            const payload = {
                clientId: selectedClientId,
                value: Number(value),
                location: location || "",
                notes: notes || null,
                photo: uploadedPhotoUrl || null,
                status: 'COMPLETED' as RideStatus,
                paymentStatus,
                rideDate: rideDate ? toISOFromLocalInput(rideDate) : null,
            };

            if (rideToEdit) {
                return rideModalService.updateRide(rideToEdit.id, payload);
            } else {
                return rideModalService.createRide(payload);
            }
        },
        onSuccess: async () => {
            toast.success(rideToEdit ? "Corrida atualizada" : "Corrida registrada");
            
            // Invalida caches relacionados
            queryClient.invalidateQueries({ queryKey: ["rides"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
            queryClient.invalidateQueries({ queryKey: ["rides-count"] });
            
            await verify(); // Atualiza contador de assinatura no AuthContext
            
            if (!rideToEdit) resetForm();
            onSuccess?.();
            onClose?.();
        },
        onError: (err) => {
            toast.error(parseApiError(err, `Erro ao ${rideToEdit ? 'atualizar' : 'registrar'} corrida.`));
        }
    });

    const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
        e?.preventDefault();

        if (!selectedClientId || !value) {
            toast.error("Informe o cliente e o valor da corrida.");
            return;
        }

        await saveRide();
    };

    const handlePresetClick = (preset: RidePreset) => {
        setValue(preset.value.toString());
        setLocation(preset.location || "");
        setIsCustomValue(false);
    };

    const nextStep = () => {
        if (currentStep === 1 && !selectedClientId) return;
        if (currentStep === 2 && !value) return;
        setCurrentStep(prev => Math.min(prev + 1, 5));
    }

    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    return {
        // Data
        clients,
        presets,
        isLoadingData,
        
        // Form state
        selectedClientId,
        setSelectedClientId,
        value,
        setValue,
        location,
        setLocation,
        notes,
        setNotes,
        photo,
        setPhoto,
        rideDate,
        setRideDate,
        paymentStatus,
        setPaymentStatus,
        isCustomValue,
        setIsCustomValue,
        
        // UI Navigation
        currentStep,
        setCurrentStep,
        isSubmitting,
        nextStep,
        prevStep,
        
        // Client creation
        newClientName,
        setNewClientName,
        isCreatingClient,
        setIsCreatingClient,
        
        // Handlers
        handleCreateClient,
        handlePhotoChange,
        handleSubmit,
        handlePresetClick,
        resetForm
    };
}
