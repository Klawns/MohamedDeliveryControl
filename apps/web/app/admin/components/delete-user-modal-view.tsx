import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type DeleteUserDialogState } from '../_hooks/use-delete-user-dialog';

interface DeleteUserModalViewProps {
  dialog: DeleteUserDialogState;
}

export function DeleteUserModalView({ dialog }: DeleteUserModalViewProps) {
  return (
    <Dialog open={dialog.open} onOpenChange={dialog.handleOpenChange}>
      <DialogContent className="max-w-sm border-white/10 bg-slate-900 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-red-500">
            <AlertTriangle size={24} />
            Excluir Usuario?
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Esta acao e irreversivel. O usuario <strong>{dialog.user?.name}</strong>{' '}
            ({dialog.user?.email}) sera removido permanentemente, junto com todas
            as suas corridas e clientes.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4 pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            dialog.handleConfirm();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="delete-user-confirmation" className="text-sm font-semibold">
              Digite{' '}
              <span className="text-red-400">
                {dialog.requiredConfirmationText}
              </span>{' '}
              para confirmar:
            </Label>
            <Input
              id="delete-user-confirmation"
              placeholder="Digite aqui..."
              autoFocus
              value={dialog.confirmationValue}
              onChange={(event) =>
                dialog.handleConfirmationChange(event.target.value)
              }
              disabled={dialog.isDeleting}
              className="border-white/5 bg-slate-950 focus:ring-red-500/50"
            />
          </div>

          {dialog.error ? (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {dialog.error}
            </div>
          ) : null}

          <DialogFooter className="gap-2 pt-6 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={dialog.handleCancel}
              disabled={dialog.isDeleting}
              className="border-white/10 text-white hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={dialog.isConfirmDisabled}
              className="gap-2 bg-red-600 font-bold text-white hover:bg-red-500"
            >
              {dialog.isDeleting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Confirmar Exclusao
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
