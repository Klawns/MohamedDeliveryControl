"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";

interface ExportDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    pixKey: string;
    setPixKey: (key: string) => void;
    onConfirm: (includePix: boolean) => void;
}

export function ExportDialog({
    isOpen,
    onOpenChange,
    pixKey,
    setPixKey,
    onConfirm,
}: ExportDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Adicionar Chave PIX?</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Você pode adicionar sua chave PIX no cabeçalho do PDF para facilitar o pagamento do cliente. (Opcional)
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Input
                        placeholder="Sua Chave PIX (ex: telefone, email, CPF)..."
                        value={pixKey}
                        onChange={(e) => setPixKey(e.target.value)}
                        className="h-12 bg-slate-950/50 border-white/5 rounded-xl text-white font-bold"
                    />
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-0 mt-2">
                    <Button
                        variant="ghost"
                        onClick={() => onConfirm(false)}
                        className="text-slate-400 hover:text-white hover:bg-white/5 h-12 w-full sm:w-auto"
                    >
                        Não Quero
                    </Button>
                    <Button
                        onClick={() => onConfirm(true)}
                        className="bg-primary hover:bg-primary/90 text-white font-bold h-12 w-full sm:w-auto rounded-xl"
                        disabled={!pixKey.trim()}
                    >
                        <Download size={18} className="mr-2" />
                        Gerar com PIX
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
