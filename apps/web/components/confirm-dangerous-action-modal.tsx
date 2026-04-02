"use client";

import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmDangerousActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  requiredText?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export function ConfirmDangerousActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  requiredText = "RESTAURAR",
  confirmText = "Confirmar e Restaurar",
  cancelText = "Cancelar",
  isLoading = false,
}: ConfirmDangerousActionModalProps) {
  const [inputValue, setInputValue] = useState("");
  const isMatch = inputValue.trim().toUpperCase() === requiredText.toUpperCase();

  // Reset input when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setInputValue("");
    }
  }, [isOpen]);

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isMatch && !isLoading) {
      onConfirm();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-modal-background border border-destructive/20 rounded-[2.5rem] p-10 shadow-2xl backdrop-blur-md max-w-lg">
        <AlertDialogHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 shadow-inner">
               <AlertTriangle size={24} />
            </div>
            <AlertDialogTitle className="text-3xl font-black text-text-primary tracking-tight leading-tight">
              {title}
            </AlertDialogTitle>
          </div>
          
          <AlertDialogDescription className="text-text-secondary text-base font-medium opacity-90 leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="mt-8 space-y-4">
          <p className="text-xs font-black uppercase tracking-widest text-destructive/80 mb-2">
            Digite <span className="underline decoration-2 underline-offset-4 decoration-destructive">"{requiredText}"</span> para confirmar a operação:
          </p>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={requiredText}
            autoFocus
            className="h-14 rounded-2xl border-2 border-border-subtle bg-background/40 px-6 font-display font-black text-lg tracking-wider focus:border-destructive/40 focus:ring-destructive/20 transition-all placeholder:opacity-30"
            disabled={isLoading}
          />
        </div>

        <AlertDialogFooter className="mt-10 flex flex-col sm:flex-row gap-4">
          <AlertDialogCancel 
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-2xl border border-border-subtle bg-secondary/10 text-text-primary hover:bg-secondary/20 h-14 font-display font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 shadow-sm"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isMatch || isLoading}
            className={cn(
              "flex-[1.5] rounded-2xl h-14 font-display font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 shadow-lg relative overflow-hidden",
              isMatch 
                ? "bg-destructive text-white hover:bg-destructive/90 shadow-destructive/20" 
                : "bg-muted text-muted-foreground cursor-not-allowed opacity-50 shadow-none border border-border-subtle"
            )}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                <span>PROCESSANDO...</span>
              </div>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
