'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useBackupDownload } from '@/hooks/use-backup-download';
import { useToast } from '@/hooks/use-toast';
import { shouldPollBackupJobs } from '@/lib/backup-query-state';
import { parseApiError } from '@/lib/api-error';
import { adminKeys } from '@/lib/query-keys';
import backupsService from '@/services/backups-service';

export function useAdminBackups() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const backupsQuery = useQuery({
    queryKey: adminKeys.technicalBackups(),
    queryFn: ({ signal }) => backupsService.listTechnicalBackups(signal),
    retry: false,
    refetchInterval: (query) => {
      return shouldPollBackupJobs(query.state.data) ? 3000 : false;
    },
    refetchIntervalInBackground: true,
  });

  const settingsQuery = useQuery({
    queryKey: adminKeys.systemBackupSettings(),
    queryFn: ({ signal }) => backupsService.getSystemBackupSettings(signal),
    retry: false,
  });

  const createTechnicalBackupMutation = useMutation({
    mutationFn: () => backupsService.createManualTechnicalBackup(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminKeys.technicalBackups(),
      });
      toast({
        title: 'Backup tecnico iniciado',
        description: 'O dump completo foi enviado para a fila.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Falha ao iniciar backup tecnico',
        description: parseApiError(
          error,
          'Nao foi possivel iniciar o backup tecnico agora. Tente novamente em instantes.',
        ),
        variant: 'destructive',
      });
    },
  });

  const updateSystemBackupSettingsMutation = useMutation({
    mutationFn: backupsService.updateSystemBackupSettings,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminKeys.systemBackupSettings(),
      });
      await queryClient.invalidateQueries({
        queryKey: adminKeys.technicalBackups(),
      });
      toast({
        title: 'Configuracao de backup atualizada',
        description: 'O scheduler e a retencao sistêmica foram reaplicados.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Falha ao salvar configuracao de backup',
        description: parseApiError(
          error,
          'Nao foi possivel salvar a configuracao do backup sistêmico.',
        ),
        variant: 'destructive',
      });
    },
  });

  const {
    downloadState,
    isPreparingDownload,
    isDownloadActive,
    startDownload,
  } = useBackupDownload({
    requestDownloadUrl: (backupId) =>
      backupsService.getTechnicalDownloadUrl(backupId),
    successTitle: 'Download tecnico iniciado',
    successDescription: 'O navegador ja iniciou a transferencia do dump tecnico.',
    errorTitle: 'Falha ao baixar dump tecnico',
    errorDescription:
      'Nao foi possivel preparar o download do dump tecnico. Tente novamente.',
  });

  return {
    backups: backupsQuery.data ?? [],
    systemSettings: settingsQuery.data ?? null,
    isLoading: backupsQuery.isLoading,
    isSettingsLoading: settingsQuery.isLoading,
    backupDownloadState: downloadState,
    errorMessage: backupsQuery.isError
      ? parseApiError(
          backupsQuery.error,
          'Nao foi possivel carregar o historico de backups tecnicos.',
        )
      : null,
    settingsErrorMessage: settingsQuery.isError
      ? parseApiError(
          settingsQuery.error,
          'Nao foi possivel carregar a configuracao do backup sistêmico.',
        )
      : null,
    isCreating: createTechnicalBackupMutation.isPending,
    isSavingSettings: updateSystemBackupSettingsMutation.isPending,
    isPreparingDownload,
    isDownloadActive,
    refresh: backupsQuery.refetch,
    createTechnicalBackup: () => createTechnicalBackupMutation.mutateAsync(),
    saveSystemBackupSettings: (input: Parameters<
      typeof backupsService.updateSystemBackupSettings
    >[0]) => updateSystemBackupSettingsMutation.mutateAsync(input),
    openDownloadUrl: startDownload,
  };
}
