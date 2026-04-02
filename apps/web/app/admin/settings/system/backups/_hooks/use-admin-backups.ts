'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useBackupDownload } from '@/hooks/use-backup-download';
import { useToast } from '@/hooks/use-toast';
import { parseApiError } from '@/lib/api-error';
import { adminKeys } from '@/lib/query-keys';
import backupsService from '@/services/backups-service';
import type { BackupJobSummary } from '@/types/backups';

export function useAdminBackups() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const backupsQuery = useQuery({
    queryKey: adminKeys.technicalBackups(),
    queryFn: ({ signal }) => backupsService.listTechnicalBackups(signal),
    retry: false,
    refetchInterval: (query) => {
      const backups = (query.state.data as BackupJobSummary[] | undefined) ?? [];
      return backups.some(
        (backup) => backup.status === 'pending' || backup.status === 'running',
      )
        ? 3000
        : false;
    },
    refetchIntervalInBackground: true,
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
    isLoading: backupsQuery.isLoading,
    backupDownloadState: downloadState,
    errorMessage: backupsQuery.isError
      ? parseApiError(
          backupsQuery.error,
          'Nao foi possivel carregar o historico de backups tecnicos.',
        )
      : null,
    isCreating: createTechnicalBackupMutation.isPending,
    isPreparingDownload,
    isDownloadActive,
    refresh: backupsQuery.refetch,
    createTechnicalBackup: () => createTechnicalBackupMutation.mutateAsync(),
    openDownloadUrl: startDownload,
  };
}
