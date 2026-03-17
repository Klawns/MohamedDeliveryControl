"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, User, Bike, ChevronRight, Star } from "lucide-react";
import { api } from "@/services/api";
import { formatCurrency, cn } from "@/lib/utils";
import { RideModal } from "@/components/ride-modal";
import { PaymentModal } from "@/components/payment-modal";
import { ClientModal } from "@/components/client-modal";
import { ClientDetailsDrawer } from "@/components/client-details-drawer";
import { ConfirmModal } from "@/components/confirm-modal";
import { useAuth } from "@/hooks/use-auth";
import { PDFService } from "@/services/pdf-service";

interface Client {
    id: string;
    name: string;
    userId: string;
    isPinned: boolean;
    createdAt: string;
}

interface Ride {
    id: string;
    clientId: string;
    value: number;
    notes?: string;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    paymentStatus: 'PENDING' | 'PAID';
    rideDate?: string;
    createdAt: string;
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [search, setSearch] = useState("");
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [rides, setRides] = useState<Ride[]>([]);
    const [isAddingClient, setIsAddingClient] = useState(false);
    const [isRideModalOpen, setIsRideModalOpen] = useState(false);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
    const [rideToEdit, setRideToEdit] = useState<Ride | null>(null);
    const [rideToDelete, setRideToDelete] = useState<Ride | null>(null);
    const [clientBalance, setClientBalance] = useState<{ totalDebt: number, totalPaid: number, remainingBalance: number } | null>(null);
    const [clientPayments, setClientPayments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSettling, setIsSettling] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeletingRide, setIsDeletingRide] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isCloseDebtConfirmOpen, setIsCloseDebtConfirmOpen] = useState(false);
    const { user } = useAuth();

    // Client List Pagination
    const [clientPage, setClientPage] = useState(1);
    const [clientTotal, setClientTotal] = useState(0);
    const clientLimit = 9;

    // Ride History Pagination
    const [ridePage, setRidePage] = useState(1);
    const [rideTotal, setRideTotal] = useState(0);
    const rideLimit = 5;

    useEffect(() => {
        if (user) {
            fetchClients();
        } else {
            setIsLoading(false);
        }
    }, [clientPage, search, user]);

    useEffect(() => {
        if (selectedClient) {
            setRidePage(1);
            fetchRides(selectedClient.id, 1);
            fetchClientBalance(selectedClient.id);
            fetchClientPayments(selectedClient.id);
        }
    }, [selectedClient]);

    useEffect(() => {
        if (selectedClient && ridePage > 1) {
            fetchRides(selectedClient.id, ridePage);
        }
    }, [ridePage]);

    const fetchClients = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("limit", clientLimit.toString());
            params.append("offset", ((clientPage - 1) * clientLimit).toString());
            if (search) params.append("search", search);

            const { data } = await api.get(`/clients?${params.toString()}`);
            setClients(data.clients || []);
            setClientTotal(data.total || 0);
        } catch (err) {
            console.error("Erro ao buscar clientes", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRides = async (clientId: string, page: number) => {
        try {
            const params = new URLSearchParams();
            params.append("limit", rideLimit.toString());
            params.append("offset", ((page - 1) * rideLimit).toString());

            const { data } = await api.get(`/rides/client/${clientId}?${params.toString()}`);

            // If it's the first page, replace results, otherwise append? 
            // Better to replace for clean pagination
            setRides(data.rides || []);
            setRideTotal(data.total || 0);
        } catch (err) {
            console.error("Erro ao buscar corridas", err);
        }
    };

    const fetchClientBalance = async (clientId: string) => {
        try {
            const { data } = await api.get(`/clients/${clientId}/balance`);
            setClientBalance(data);
        } catch (err) {
            console.error("Erro ao buscar saldo do cliente", err);
        }
    };

    const fetchClientPayments = async (clientId: string) => {
        try {
            const { data } = await api.get(`/clients/${clientId}/payments`);
            setClientPayments(data || []);
        } catch (err) {
            console.error("Erro ao buscar pagamentos do cliente", err);
        }
    };

    const handleGeneratePDF = async () => {
        if (!selectedClient || !clientBalance) return;

        try {
            // Get all pending rides for the report (without pagination)
            const { data } = await api.get(`/rides/client/${selectedClient.id}?limit=100`);
            
            PDFService.generateClientDebtReport(
                { name: selectedClient.name, id: selectedClient.id },
                data.rides || [],
                clientPayments,
                clientBalance,
                { userName: user?.name || "Motorista" }
            );
        } catch (err) {
            alert("Erro ao gerar PDF.");
        }
    };

    const handleCloseDebt = async () => {
        if (!selectedClient) return;
        
        setIsSettling(true);
        try {
            await api.post(`/clients/${selectedClient.id}/close-debt`);
            fetchClientBalance(selectedClient.id);
            fetchClientPayments(selectedClient.id);
            fetchRides(selectedClient.id, 1);
            setIsCloseDebtConfirmOpen(false);
        } catch (err) {
            alert("Erro ao fechar dívida.");
        } finally {
            setIsSettling(false);
        }
    };

    const handleDeleteClient = async () => {
        if (!selectedClient) return;

        setIsDeleting(true);
        try {
            await api.delete(`/clients/${selectedClient.id}`);
            setSelectedClient(null);
            fetchClients();
            setIsDeleteConfirmOpen(false);
        } catch (err) {
            console.error("Erro ao excluir cliente", err);
            alert("Erro ao excluir cliente. Verifique se ele possui dados vinculados ou tente novamente.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditRide = (ride: any) => {
        setRideToEdit(ride);
        setIsRideModalOpen(true);
    };

    const handleDeleteRide = async () => {
        if (!rideToDelete || !selectedClient) return;

        setIsDeletingRide(true);
        try {
            await api.delete(`/rides/${rideToDelete.id}`);
            fetchRides(selectedClient.id, ridePage);
            fetchClientBalance(selectedClient.id);
            setRideToDelete(null);
        } catch (err) {
            console.error("Erro ao excluir corrida", err);
            alert("Erro ao excluir corrida.");
        } finally {
            setIsDeletingRide(false);
        }
    };

    const handleEditClient = (client: Client) => {
        setClientToEdit(client);
        setIsClientModalOpen(true);
    };

    const handleNewClient = () => {
        setClientToEdit(null);
        setIsClientModalOpen(true);
    };

    const handleCreateClient = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;

        try {
            await api.post("/clients", { name });
            setIsAddingClient(false);
            fetchClients();
        } catch (err) {
            alert("Erro ao criar cliente");
        }
    };


    const filteredClients = clients.filter((c: Client) =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Meus Clientes</h1>
                    <p className="text-slate-400 mt-1">Gerencie sua base e inicie novas corridas.</p>
                </div>
                <button
                    onClick={handleNewClient}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                    <Plus size={20} />
                    Novo Cliente
                </button>
            </header>

            <div className="relative group max-w-2xl">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-blue-400 transition-colors text-slate-500">
                    <Search size={20} />
                </div>
                <input
                    type="text"
                    placeholder="Buscar por nome do cliente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="h-10 w-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {clients.map((client: Client) => (
                            <motion.div
                                key={client.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => handleEditClient(client)}
                                className="glass-card p-6 rounded-3xl border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition-all cursor-pointer group relative overflow-hidden"
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="p-4 bg-white/5 rounded-2xl text-slate-300 group-hover:scale-110 transition-transform">
                                        <User size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-white text-lg truncate">{client.name}</h3>
                                        <p className="text-sm text-slate-500">Clique para ver detalhes</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                try {
                                                    await api.patch(`/clients/${client.id}`, { isPinned: !client.isPinned });
                                                    fetchClients();
                                                } catch (err) {
                                                    alert("Erro ao fixar cliente");
                                                }
                                            }}
                                            className={cn(
                                                "p-3 rounded-xl transition-all active:scale-90",
                                                client.isPinned
                                                    ? "bg-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white shadow-lg shadow-amber-500/20"
                                                    : "bg-white/5 text-slate-500 hover:bg-white/10 hover:text-white"
                                            )}
                                            title={client.isPinned ? "Desafixar" : "Fixar"}
                                        >
                                            <Star size={18} className={cn(client.isPinned && "fill-amber-500 hover:fill-white")} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedClient(client);
                                                setIsRideModalOpen(true);
                                            }}
                                            className="p-3 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl transition-all active:scale-90 shadow-lg shadow-blue-600/0 hover:shadow-blue-600/20"
                                            title="Nova Corrida Rápida"
                                        >
                                            <Bike size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedClient(client);
                                            }}
                                            className="p-3 hover:bg-white/5 rounded-xl text-slate-600 hover:text-white transition-all group/arrow"
                                            title="Ver Histórico"
                                        >
                                            <ChevronRight className="group-hover/arrow:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Controles de Paginação (Clientes) */}
                    {clientTotal > clientLimit && (
                        <div className="flex items-center justify-between mt-10 px-2">
                            <p className="text-sm text-slate-500 font-medium">
                                <span className="text-white">{(clientPage - 1) * clientLimit + 1}</span>-
                                <span className="text-white">{Math.min(clientPage * clientLimit, clientTotal)}</span> de <span className="text-white">{clientTotal}</span> clientes
                            </p>
                            <div className="flex gap-2">
                                <button
                                    disabled={clientPage === 1}
                                    onClick={() => { setClientPage((p: number) => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    className="px-4 py-2 bg-slate-900 border border-white/5 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Anterior
                                </button>
                                <button
                                    disabled={clientPage * clientLimit >= clientTotal}
                                    onClick={() => { setClientPage((p: number) => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    className="px-4 py-2 bg-slate-900 border border-white/5 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Próxima
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            <ClientDetailsDrawer
                client={selectedClient}
                rides={rides}
                balance={clientBalance}
                ridePage={ridePage}
                rideTotal={rideTotal}
                rideLimit={rideLimit}
                isSettling={isSettling}
                isDeleting={isDeleting}
                onClose={() => setSelectedClient(null)}
                onNewRide={() => setIsRideModalOpen(true)}
                onCloseDebt={() => setIsCloseDebtConfirmOpen(true)}
                onAddPayment={() => setIsPaymentModalOpen(true)}
                onGeneratePDF={handleGeneratePDF}
                onDeleteClient={() => setIsDeleteConfirmOpen(true)}
                onEditRide={handleEditRide}
                onDeleteRide={(ride) => setRideToDelete(ride as Ride)}
                onPageChange={setRidePage}
            />

            <RideModal
                isOpen={isRideModalOpen}
                onClose={() => setIsRideModalOpen(false)}
                onSuccess={() => {
                    if (selectedClient) {
                        fetchRides(selectedClient.id, ridePage);
                        fetchClientBalance(selectedClient.id);
                    }
                    setRideToEdit(null);
                }}
                clientId={selectedClient?.id}
                clientName={selectedClient?.name}
                rideToEdit={rideToEdit}
            />
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onSuccess={() => {
                    if (selectedClient) {
                        fetchClientBalance(selectedClient.id);
                        fetchClientPayments(selectedClient.id);
                    }
                }}
                clientId={selectedClient?.id || ""}
                clientName={selectedClient?.name || ""}
            />
            <ClientModal
                isOpen={isClientModalOpen}
                onClose={() => {
                    setIsClientModalOpen(false);
                    setClientToEdit(null);
                }}
                onSuccess={fetchClients}
                clientToEdit={clientToEdit || undefined}
            />

            <ConfirmModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={handleDeleteClient}
                title="Excluir Cliente"
                description={`Deseja realmente excluir o cliente "${selectedClient?.name}"? Esta ação é IRREVERSÍVEL e excluirá todas as corridas e pagamentos vinculados.`}
                confirmText="Excluir"
                variant="danger"
                isLoading={isDeleting}
            />

            <ConfirmModal
                isOpen={isCloseDebtConfirmOpen}
                onClose={() => setIsCloseDebtConfirmOpen(false)}
                onConfirm={handleCloseDebt}
                title="Fechar Dívida"
                description={`Deseja realmente fechar a dívida de ${selectedClient?.name}? Isso marcará as corridas como pagas e os adiantamentos como usados.`}
                confirmText="Fechar Dívida"
                isLoading={isSettling}
            />

            <ConfirmModal
                isOpen={!!rideToDelete}
                onClose={() => setRideToDelete(null)}
                onConfirm={handleDeleteRide}
                title="Excluir Corrida"
                description="Deseja realmente excluir esta corrida?"
                confirmText="Excluir"
                variant="danger"
                isLoading={isDeletingRide}
            />
        </div>
    );
}
