'use client';

import { toast } from 'sonner';
import { parseApiError } from '@/lib/api-error';
import { useSubmitRideMutation } from '@/hooks/mutations/use-submit-ride-mutation';
import { type RideViewModel } from '@/types/rides';
import { type RideSubmissionDraft } from '../lib/ride-submission';

interface UseRideFormSubmitProps {
  draft: RideSubmissionDraft;
  rideToEdit?: RideViewModel | null;
  resetForm: () => void;
  onSuccess?: () => void;
  onClose?: () => void;
}

export function useRideFormSubmit({
  draft,
  rideToEdit,
  resetForm,
  onSuccess,
  onClose,
}: UseRideFormSubmitProps) {
  const mutation = useSubmitRideMutation({
    onSuccess: async (ride) => {
      if (rideToEdit && ride.paymentStatus === 'PENDING') {
        toast.success(
          'Corrida atualizada. O status financeiro voltou para pendente.',
        );
      } else {
        toast.success(rideToEdit ? 'Corrida atualizada' : 'Corrida registrada');
      }

      if (!rideToEdit) {
        resetForm();
      }

      onSuccess?.();
      onClose?.();
    },
    onError: async (error) => {
      toast.error(
        parseApiError(
          error,
          `Erro ao ${rideToEdit ? 'atualizar' : 'registrar'} corrida.`,
        ),
      );
    },
  });

  return {
    isSubmitting: mutation.isPending,
    handleSubmit: async (event?: React.FormEvent | React.MouseEvent) => {
      event?.preventDefault();

      if (!draft.selectedClientId || !draft.value) {
        toast.error('Informe o cliente e o valor da corrida.');
        return;
      }

      await mutation.mutateAsync({
        draft,
        rideToEdit,
      });
    },
  };
}
