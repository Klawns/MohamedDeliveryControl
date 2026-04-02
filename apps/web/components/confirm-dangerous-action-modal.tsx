"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
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
  const dialogKey = `${requiredText}-${isOpen ? "open" : "closed"}`;
  const isMatch =
    inputValue.trim().toUpperCase() === requiredText.toUpperCase();

  const handleConfirm = (event: React.MouseEvent) => {
    event.preventDefault();

    if (isMatch && !isLoading) {
      onConfirm();
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent
        key={dialogKey}
        className="max-w-lg rounded-[2.5rem] border border-destructive/20 bg-modal-background p-10 shadow-2xl backdrop-blur-md"
      >
        <AlertDialogHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive shadow-inner">
              <AlertTriangle size={24} />
            </div>
            <AlertDialogTitle className="text-3xl font-black leading-tight tracking-tight text-text-primary">
              {title}
            </AlertDialogTitle>
          </div>

          <AlertDialogDescription className="text-base font-medium leading-relaxed text-text-secondary opacity-90">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="mt-8 space-y-4">
          <p className="mb-2 text-xs font-black uppercase tracking-widest text-destructive/80">
            Digite{" "}
            <span className="underline decoration-2 underline-offset-4 decoration-destructive">
              &quot;{requiredText}&quot;
            </span>{" "}
            para confirmar a operacao:
          </p>
          <Input
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder={requiredText}
            autoFocus
            className="h-14 rounded-2xl border-2 border-border-subtle bg-background/40 px-6 font-display text-lg font-black tracking-wider transition-all placeholder:opacity-30 focus:border-destructive/40 focus:ring-destructive/20"
            disabled={isLoading}
          />
        </div>

        <AlertDialogFooter className="mt-10 flex flex-col gap-4 sm:flex-row">
          <AlertDialogCancel
            onClick={onClose}
            disabled={isLoading}
            className="h-14 flex-1 rounded-2xl border border-border-subtle bg-secondary/10 font-display text-[11px] font-black uppercase tracking-widest text-text-primary shadow-sm transition-all hover:bg-secondary/20 active:scale-95"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isMatch || isLoading}
            className={cn(
              "relative h-14 flex-[1.5] overflow-hidden rounded-2xl font-display text-[11px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95",
              isMatch
                ? "bg-destructive text-white shadow-destructive/20 hover:bg-destructive/90"
                : "cursor-not-allowed border border-border-subtle bg-muted text-muted-foreground opacity-50 shadow-none",
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
