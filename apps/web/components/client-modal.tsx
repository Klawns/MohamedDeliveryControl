"use client";

import { useState, useEffect } from "react";
import { X, User, CheckCircle2, Phone, MapPin } from "lucide-react";
import { api, apiClient } from "@/services/api";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    clientToEdit?: {
        id: string;
        name: string;
        phone?: string;
        address?: string;
    };
}

export function ClientModal({ isOpen, onClose, onSuccess, clientToEdit }: ClientModalProps) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (clientToEdit) {
                setName(clientToEdit.name || "");
                setPhone(clientToEdit.phone || "");
                setAddress(clientToEdit.address || "");
            } else {
                setName("");
                setPhone("");
                setAddress("");
            }
        }
    }, [isOpen, clientToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        setIsSubmitting(true);
        try {
            const payload = {
                name,
                phone: phone || null,
                address: address || null,
            };

            if (clientToEdit) {
                await apiClient.patch(`/clients/${clientToEdit.id}`, payload);
            } else {
                await apiClient.post("/clients", payload);
            }

            onSuccess();
            onClose();
        } catch (err) {
            alert(`Erro ao ${clientToEdit ? 'atualizar' : 'cadastrar'} cliente. Tente novamente.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent showCloseButton={false} className="bg-modal-background border-border p-0 overflow-hidden sm:rounded-[2.5rem] w-[calc(100%-2rem)] max-w-md gap-0 shadow-2xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>{clientToEdit ? 'Editar Cliente' : 'Cadastrar Cliente'}</DialogTitle>
                    <DialogDescription>
                        {clientToEdit ? 'Altere os dados do cliente.' : 'Adicione um novo cliente à sua base.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col relative">
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 z-20 p-2.5 bg-secondary/10 hover:bg-secondary/20 rounded-xl text-text-secondary hover:text-text-primary transition-all group border border-border-subtle shadow-lg"
                        title="Fechar"
                    >
                        <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>

                    {/* Barra decorativa mobile */}
                    <div className="sm:hidden w-12 h-1.5 bg-border-subtle rounded-full mx-auto my-4 shrink-0" />

                    <div className="px-8 pt-8 pb-6 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-icon-info/10 rounded-2xl flex items-center justify-center text-icon-info font-black shadow-inner border border-icon-info/10">
                                <User size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-text-primary tracking-tighter leading-none">{clientToEdit ? 'Editar Cliente' : 'Novo Cliente'}</h2>
                                <p className="text-text-secondary text-[10px] sm:text-xs mt-1.5 uppercase tracking-[0.2em] font-bold opacity-70">Base de Dados</p>
                            </div>
                        </div>
                    </div>

                    <div className="px-8 pb-10">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest pl-1">Nome Completo</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-icon-brand transition-colors">
                                        <User size={18} />
                                    </div>
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="w-full bg-background/50 border border-border-subtle rounded-xl py-3 pl-12 pr-4 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all font-medium"
                                        placeholder="Ex: Pastelaria do Jhow"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest pl-1">Telefone (opcional)</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-icon-brand transition-colors">
                                        <Phone size={18} />
                                    </div>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full bg-background/50 border border-border-subtle rounded-xl py-3 pl-12 pr-4 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all font-medium"
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest pl-1">Endereço/Ponto de Referência (opcional)</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-4 text-text-secondary group-focus-within:text-icon-brand transition-colors">
                                        <MapPin size={18} />
                                    </div>
                                    <textarea
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        rows={2}
                                        className="w-full bg-background/50 border border-border-subtle rounded-xl py-3 pl-12 pr-4 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all font-medium resize-none"
                                        placeholder="Rua Exemplo, 123..."
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-button-primary hover:bg-button-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-button-primary-foreground font-black py-4 rounded-xl transition-all shadow-lg shadow-button-shadow text-base flex items-center justify-center gap-3 active:scale-[0.98] group mt-4"
                            >
                                {isSubmitting ? (
                                    <div className="h-7 w-7 border-[3px] border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        {clientToEdit ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                                        <CheckCircle2 size={24} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
