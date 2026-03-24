import { api, apiClient } from "@/services/api";
import { ridesService } from "@/services/rides-service";
import { CreateRideDTO, UpdateRideDTO, Client, Ride, RidePreset } from "@/types/rides";

/**
 * Service específico do modal de corridas.
 * Delega operações de corrida ao service global e
 * encapsula operações exclusivas do modal (ex: listar clientes).
 */
export const rideModalService = {
    async getClients(): Promise<{ clients: Client[] }> {
        const response = await apiClient.getPaginated<Client[]>("/clients");
        return { clients: response.data || [] };
    },

    async getRidePresets(): Promise<RidePreset[]> {
        return ridesService.getRidePresets();
    },

    async createClient(name: string): Promise<Client> {
        return apiClient.post("/clients", { name });
    },

    async createRide(payload: CreateRideDTO): Promise<Ride> {
        return ridesService.createRide(payload);
    },

    async updateRide(id: string, payload: UpdateRideDTO): Promise<Ride> {
        return ridesService.updateRide(id, payload);
    },
};
