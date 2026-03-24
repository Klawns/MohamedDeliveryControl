"use client";

import { useState, useEffect, useCallback } from "react";
import { api, apiClient } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export function useRidePresets() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [presets, setPresets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const loadPresets = useCallback(async () => {
        try {
            const data = await apiClient.get<any[]>("/settings/ride-presets");
            setPresets(data);
        } catch (err) {
            console.error("Erro ao carregar presets", err);
            toast({
                title: "Erro ao carregar",
                description: "Não foi possível carregar seus atalhos.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (user) {
            loadPresets();
        } else {
            setIsLoading(false);
        }
    }, [user, loadPresets]);

    const addPreset = async (newPreset: { value: string; location: string }) => {
        if (!newPreset.value || !newPreset.location) {
            toast({
                title: "Campos obrigatórios",
                description: "Preencha valor e localidade.",
                variant: "destructive"
            });
            return false;
        }

        setIsSaving(true);
        try {
            const data = await apiClient.post("/settings/ride-presets", {
                ...newPreset,
                label: newPreset.location,
                value: Number(newPreset.value)
            });
            setPresets(prev => [...prev, data]);
            toast({
                title: "Atalho adicionado! 🚀",
                description: "Seu novo botão já está disponível no painel mobile.",
            });
            return true;
        } catch (err) {
            toast({
                title: "Erro ao adicionar",
                description: "Tente novamente mais tarde.",
                variant: "destructive"
            });
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const deletePreset = async (id: string) => {
        try {
            await apiClient.delete(`/settings/ride-presets/${id}`);
            setPresets(prev => prev.filter(p => p.id !== id));
            toast({
                title: "Atalho removido",
                description: "O botão foi excluído com sucesso.",
            });
            return true;
        } catch (err) {
            toast({
                title: "Erro ao remover",
                description: "Tente novamente mais tarde.",
                variant: "destructive"
            });
            return false;
        }
    };

    const updatePreset = async (id: string, updateData: { value: number; location: string }) => {
        setIsUpdating(true);
        try {
            const data = await apiClient.patch(`/settings/ride-presets/${id}`, {
                label: updateData.location,
                value: updateData.value,
                location: updateData.location
            });

            setPresets(prev => prev.map(p => p.id === data.id ? data : p));
            toast({ title: "Atalho atualizado! ✏️" });
            return true;
        } catch (err) {
            toast({ title: "Erro ao atualizar", variant: "destructive" });
            return false;
        } finally {
            setIsUpdating(false);
        }
    };

    return {
        presets,
        isLoading,
        isSaving,
        isUpdating,
        addPreset,
        deletePreset,
        updatePreset,
        refreshPresets: loadPresets
    };
}
