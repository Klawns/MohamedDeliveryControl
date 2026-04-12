'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { toLocalInputValue } from '@/lib/date-utils';
import { type RideModalProps } from '@/types/rides';
import { useRideClientCreation } from './use-ride-client-creation';
import { useRideFormData } from './use-ride-form-data';
import { useRideFormState } from './use-ride-form-state';
import { useRideFormSubmit } from './use-ride-form-submit';

export function useRideForm({
  isOpen,
  onClose,
  onSuccess,
  clientId,
  rideToEdit,
}: Partial<RideModalProps>) {
  const { user } = useAuth();
  const form = useRideFormState({ clientId });
  const originalRideClientId = rideToEdit?.clientId || clientId || '';
  const hasShownFinancialImpactWarningRef = useRef(false);
  const shouldLoadClientDirectory = !clientId || Boolean(rideToEdit);
  const {
    clientSearch,
    currentStep,
    handlePresetClick,
    isCreatingClient,
    isCustomValue,
    location,
    newClientName,
    notes,
    paymentStatus,
    photo,
    resetForm,
    rideDate,
    selectedClientId,
    setCurrentStep,
    setIsCreatingClient,
    setIsCustomValue,
    setClientSearch,
    setLocation,
    setNewClientName,
    setNotes,
    setPaymentStatus,
    setPhoto,
    setRideDate,
    setSelectedClientId,
    setUseBalance,
    setValue,
    useBalance,
    value,
  } = form;

  const data = useRideFormData({
    isOpen,
    userId: user?.id,
    clientSearch,
    selectedClientId,
    shouldLoadDirectory: shouldLoadClientDirectory,
  });

  useEffect(() => {
    if (!isOpen || !user) {
      return;
    }

    if (rideToEdit) {
      setSelectedClientId(originalRideClientId);
      setValue(rideToEdit.value.toString());
      setLocation(rideToEdit.location || '');
      setNotes(rideToEdit.notes || '');
      setRideDate(toLocalInputValue(rideToEdit.rideDate || ''));
      setPaymentStatus(rideToEdit.paymentStatus || 'PAID');
      setPhoto(rideToEdit.photo || null);
      setIsCustomValue(true);
      setCurrentStep(2);
      return;
    }

    resetForm();
  }, [
    isOpen,
    resetForm,
    rideToEdit,
    originalRideClientId,
    setCurrentStep,
    setIsCustomValue,
    setLocation,
    setNotes,
    setPaymentStatus,
    setPhoto,
    setRideDate,
    setSelectedClientId,
    setValue,
    user,
  ]);

  useEffect(() => {
    if (!useBalance || !value) {
      return;
    }

    const rideValue = Number(value);
    const debt = Math.max(0, rideValue - data.clientBalance);
    setPaymentStatus(debt > 0 ? 'PENDING' : 'PAID');
  }, [data.clientBalance, setPaymentStatus, useBalance, value]);

  const previousPaidWithBalance = Number(rideToEdit?.paidWithBalance ?? 0);
  const previousDebtValue = Number(rideToEdit?.debtValue ?? 0);
  const previousPaidExternally = rideToEdit
    ? Math.max(0, Number(rideToEdit.value) - previousPaidWithBalance - previousDebtValue)
    : 0;
  const nextRideValue = Number(value) || 0;
  const didPaymentInputsChange = Boolean(
    rideToEdit &&
      (selectedClientId !== originalRideClientId ||
        nextRideValue !== Number(rideToEdit.value)),
  );
  const nextPaidWithBalance = rideToEdit
    ? selectedClientId === originalRideClientId
      ? Math.min(
          previousPaidWithBalance,
          Math.max(0, nextRideValue - previousPaidExternally),
        )
      : 0
    : 0;
  const recalculatedDebtOnSave = rideToEdit
    ? Math.max(0, nextRideValue - previousPaidExternally - nextPaidWithBalance)
    : 0;
  const willReopenDebtOnSave = Boolean(
    rideToEdit && didPaymentInputsChange && recalculatedDebtOnSave > 0,
  );

  useEffect(() => {
    if (!willReopenDebtOnSave) {
      hasShownFinancialImpactWarningRef.current = false;
      return;
    }

    setPaymentStatus('PENDING');
  }, [setPaymentStatus, willReopenDebtOnSave]);

  useEffect(() => {
    if (!didPaymentInputsChange || !willReopenDebtOnSave) {
      hasShownFinancialImpactWarningRef.current = false;
      return;
    }

    if (hasShownFinancialImpactWarningRef.current) {
      return;
    }

    hasShownFinancialImpactWarningRef.current = true;
    toast.warning('Essa edicao reabre a pendencia. A corrida sera salva como pendente.', {
      duration: 10000,
      closeButton: true,
    });
  }, [didPaymentInputsChange, willReopenDebtOnSave]);

  const effectivePaymentStatus = willReopenDebtOnSave ? 'PENDING' : paymentStatus;

  const clientCreation = useRideClientCreation({
    newClientName,
    setSelectedClientId,
    setNewClientName,
    setCurrentStep,
  });

  const submission = useRideFormSubmit({
    draft: {
      selectedClientId,
      value,
      location,
      notes,
      photo,
      rideDate,
      paymentStatus: effectivePaymentStatus,
      useBalance,
    },
    rideToEdit,
    resetForm,
    onSuccess,
    onClose,
  });

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const nextStep = () => {
    if (currentStep === 1 && !selectedClientId) {
      return;
    }

    if (currentStep === 2 && !value) {
      return;
    }

    setCurrentStep((previous) => Math.min(previous + 1, 5));
  };

  const prevStep = () => setCurrentStep((previous) => Math.max(previous - 1, 1));

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'Enter') {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'textarea') {
      return;
    }

    event.preventDefault();

    if (isCreatingClient && newClientName.trim()) {
      void clientCreation.handleCreateClient();
      return;
    }

    const canAdvance =
      (currentStep === 1 && !!selectedClientId) ||
      (currentStep === 2 && !!value) ||
      currentStep > 2;

    if (!canAdvance) {
      return;
    }

    if (currentStep === 5) {
      void submission.handleSubmit();
      return;
    }

    nextStep();
  };

  const rideValue = Number(value) || 0;
  const paidWithBalance = useBalance ? Math.min(data.clientBalance, rideValue) : 0;
  const debtValue = Math.max(0, rideValue - paidWithBalance);

  return {
    clients: data.clients,
    presets: data.presets,
    isLoadingClientDirectory: data.isLoadingClientDirectory,
    isFetchingClientDirectory: data.isFetchingClientDirectory,
    isLoadingPresets: data.isLoadingPresets,
    isLoadingData: data.isLoadingData,
    isFetchingClients: data.isFetchingClients,
    isClientDirectoryError: data.isClientDirectoryError,
    clientDirectoryError: data.clientDirectoryError,
    retryClientDirectory: data.retryClientDirectory,
    isClientDirectoryReady: data.isClientDirectoryReady,
    clientDirectoryMeta: data.clientDirectoryMeta,
    ...form,
    paymentStatus: effectivePaymentStatus,
    paidWithBalance,
    debtValue,
    isSubmitting: submission.isSubmitting,
    isSubmittingClient: clientCreation.isSubmittingClient,
    nextStep,
    prevStep,
    availableBalance: data.clientBalance,
    handleCreateClient: clientCreation.handleCreateClient,
    handlePhotoChange,
    handleSubmit: submission.handleSubmit,
    handleKeyDown,
    willReopenDebtOnSave,
    projectedDebtValue: recalculatedDebtOnSave,
  };
}
