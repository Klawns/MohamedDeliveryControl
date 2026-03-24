"use client";

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
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = 'default',
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-modal-background border border-border-subtle rounded-[2.5rem] p-10 shadow-2xl backdrop-blur-md">
        <AlertDialogHeader className="space-y-4">
          <AlertDialogTitle className="text-3xl font-black text-text-primary tracking-tight">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-text-secondary text-base font-medium opacity-80 leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-10 flex gap-4">
          <AlertDialogCancel 
            onClick={onClose}
            className="rounded-2xl border border-border-subtle bg-secondary/10 text-text-primary hover:bg-secondary/20 px-8 py-4 font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-sm"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className={cn(
              "rounded-2xl px-8 py-4 font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-lg",
              variant === 'danger' 
                ? "bg-button-destructive text-button-destructive-foreground hover:bg-button-destructive-hover shadow-destructive/20" 
                : "bg-button-primary text-button-primary-foreground hover:bg-button-primary-hover shadow-button-shadow"
            )}
          >
            {isLoading ? "PROCESSANDO..." : confirmText.toUpperCase()}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
