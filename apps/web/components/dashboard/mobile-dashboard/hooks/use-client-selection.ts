"use client";

import { useState, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { api, apiClient } from "@/services/api";
import { Client } from "@/types/rides";
import { CLIENTS_PER_PAGE } from "../constants";
import { useInfiniteClients } from "./use-infinite-clients";

export function useClientSelection() {
    const { toast } = useToast();
    
    const {
        data: clientsData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isLoadingClients,
        isError: isClientsError,
        error: clientsError,
        refetch: refetchClients
    } = useInfiniteClients({
        limit: CLIENTS_PER_PAGE
    });

    const clients = useMemo(() => {
        const allClients = clientsData?.pages.flatMap(page => page.data || []) || [];
        return Array.from(new Map(
            allClients
                .filter(c => c && c.id)
                .map(c => [String(c.id), c])
        ).values());
    }, [clientsData]);
    
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [newClientName, setNewClientName] = useState("");
    const [isCreatingClient, setIsCreatingClient] = useState(false);

    const handleCreateClient = useCallback(async (onCreated?: (client: Client) => void) => {
        if (!newClientName) return;
        setIsCreatingClient(true);
        try {
            const data = await apiClient.post<Client>("/clients", { name: newClientName });
            await refetchClients();
            setIsClientModalOpen(false);
            setNewClientName("");
            toast({ title: "Cliente cadastrado! 👤" });
            if (onCreated) onCreated(data);
        } catch (err) {
            toast({ title: "Erro ao cadastrar", variant: "destructive" });
        } finally {
            setIsCreatingClient(false);
        }
    }, [newClientName, refetchClients, toast]);

    return {
        clients,
        isLoadingClients,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        isClientsError,
        clientsError,
        refetchClients,
        isClientModalOpen,
        setIsClientModalOpen,
        newClientName,
        setNewClientName,
        isCreatingClient,
        handleCreateClient
    };
}
