"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useBackupDownload } from "@/hooks/use-backup-download";
import {
  clientKeys,
  financeKeys,
  rideKeys,
  settingsKeys,
} from "@/lib/query-keys";
import { parseApiError } from "@/lib/api-error";
import { useToast } from "@/hooks/use-toast";
import backupsService from "@/services/backups-service";
import type {
  BackupAutomationStatus,
  BackupImportExecutionResponse,
  BackupImportJobResponse,
  BackupJobSummary,
} from "@/types/backups";

const ACTIVE_IMPORT_STORAGE_KEY = "backups.activeImportJobId";

export function useBackups() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewResult, setPreviewResult] =
    useState<BackupImportJobResponse | null>(null);
  const completedImportRefreshRef = useRef<string | null>(null);
  const [activeImportJobId, setActiveImportJobId] = useState<string | null>(
    () => {
      if (typeof window === "undefined") {
        return null;
      }

      return window.localStorage.getItem(ACTIVE_IMPORT_STORAGE_KEY);
    },
  );

  const setPersistedActiveImportJobId = (importJobId: string | null) => {
    setActiveImportJobId(importJobId);

    if (typeof window === "undefined") {
      return;
    }

    if (importJobId) {
      window.localStorage.setItem(ACTIVE_IMPORT_STORAGE_KEY, importJobId);
      return;
    }

    window.localStorage.removeItem(ACTIVE_IMPORT_STORAGE_KEY);
  };

  const refreshImportedData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: settingsKeys.backups() }),
      queryClient.invalidateQueries({ queryKey: settingsKeys.backupsStatus() }),
      queryClient.invalidateQueries({ queryKey: settingsKeys.presets() }),
      queryClient.invalidateQueries({ queryKey: clientKeys.all }),
      queryClient.invalidateQueries({ queryKey: rideKeys.all }),
      queryClient.invalidateQueries({ queryKey: financeKeys.all }),
    ]);
  };

  const finalizeSuccessfulImport = async (
    importJob: BackupImportJobResponse,
  ) => {
    if (completedImportRefreshRef.current === importJob.id) {
      return;
    }

    completedImportRefreshRef.current = importJob.id;
    setPersistedActiveImportJobId(null);
    setPreviewResult(null);
    await refreshImportedData();
  };

  const handleResolvedImportJob = useEffectEvent(
    (importJob: BackupImportJobResponse) => {
      if (importJob.status === "success") {
        void finalizeSuccessfulImport(importJob);
        return;
      }

      completedImportRefreshRef.current = null;
      setPreviewResult(importJob);
      setPersistedActiveImportJobId(null);
    },
  );

  const backupsQuery = useQuery({
    queryKey: settingsKeys.backups(),
    queryFn: ({ signal }) => backupsService.listUserBackups(signal),
    refetchInterval: (query) => {
      const backups =
        (query.state.data as BackupJobSummary[] | undefined) ?? [];
      return backups.some(
        (backup) => backup.status === "pending" || backup.status === "running",
      )
        ? 3000
        : false;
    },
    refetchIntervalInBackground: true,
  });

  const backupStatusQuery = useQuery({
    queryKey: settingsKeys.backupsStatus(),
    queryFn: ({ signal }) => backupsService.getUserBackupStatus(signal),
  });

  const importStatusQuery = useQuery({
    queryKey: settingsKeys.backupImport(activeImportJobId ?? "idle"),
    enabled: Boolean(activeImportJobId),
    queryFn: ({ signal }) =>
      backupsService.getImportStatus(activeImportJobId!, signal),
    refetchInterval: (query) => {
      const importJob = query.state.data as BackupImportJobResponse | undefined;
      return importJob?.status === "running" ? 1500 : false;
    },
    refetchIntervalInBackground: true,
    retry: false,
  });

  useEffect(() => {
    const importJob = importStatusQuery.data;

    if (!importJob) {
      return;
    }

    if (importJob.status === "running") {
      completedImportRefreshRef.current = null;
      return;
    }

    queueMicrotask(() => {
      handleResolvedImportJob(importJob);
    });
  }, [importStatusQuery.data]);

  useEffect(() => {
    if (!importStatusQuery.error) {
      return;
    }

    queueMicrotask(() => {
      setPersistedActiveImportJobId(null);
    });
  }, [importStatusQuery.error]);

  const createManualBackupMutation = useMutation({
    mutationFn: () => backupsService.createManualBackup(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: settingsKeys.backups() }),
        queryClient.invalidateQueries({
          queryKey: settingsKeys.backupsStatus(),
        }),
      ]);
      toast({
        title: "Backup iniciado",
        description: "A geracao do arquivo foi colocada na fila.",
      });
    },
    onError: (error) => {
      toast({
        title: "Falha ao iniciar backup",
        description: parseApiError(
          error,
          "Nao foi possivel iniciar o backup agora. Tente novamente em instantes.",
        ),
        variant: "destructive",
      });
    },
  });

  const previewImportMutation = useMutation({
    mutationFn: (file: File) => backupsService.previewImport(file),
    onMutate: () => {
      setPreviewResult(null);
    },
    onSuccess: (response) => {
      setPreviewResult(response);
    },
    onError: (error) => {
      setPreviewResult(null);
      toast({
        title: "Falha ao validar backup",
        description: parseApiError(
          error,
          "Nao foi possivel validar o arquivo do backup. Tente novamente.",
        ),
        variant: "destructive",
      });
    },
  });

  const executeImportMutation = useMutation({
    mutationFn: (importJobId: string) =>
      backupsService.executeImport(importJobId),
    onMutate: (importJobId) => {
      setPersistedActiveImportJobId(importJobId);
      setPreviewResult((current) =>
        current && current.id === importJobId
          ? {
              ...current,
              status: "running",
              phase: "backing_up",
              errorMessage: null,
              startedAt: new Date().toISOString(),
              finishedAt: null,
            }
          : current,
      );
    },
    onSuccess: async (response) => {
      await finalizeSuccessfulImport(response);

      toast({
        title: "Backup importado",
        description: "Os dados operacionais foram restaurados com sucesso.",
      });

      return response;
    },
    onError: (error) => {
      const description = parseApiError(
        error,
        "Nao foi possivel concluir a importacao do backup. Tente novamente.",
      );

      setPersistedActiveImportJobId(null);
      completedImportRefreshRef.current = null;
      setPreviewResult((current) =>
        current
          ? {
              ...current,
              status: "failed",
              phase: "failed",
              errorMessage: description,
              finishedAt: new Date().toISOString(),
            }
          : current,
      );

      toast({
        title: "Falha ao importar backup",
        description,
        variant: "destructive",
      });
    },
  });

  const {
    downloadState,
    isPreparingDownload,
    isDownloadActive,
    startDownload,
  } = useBackupDownload({
    requestDownloadUrl: (backupId) => backupsService.getDownloadUrl(backupId),
    successTitle: "Download iniciado",
    successDescription: "O navegador ja iniciou a transferencia do backup.",
    errorTitle: "Falha ao baixar backup",
    errorDescription:
      "Nao foi possivel preparar o download do backup. Tente novamente.",
  });

  const previewImport = async (file: File) => {
    return previewImportMutation.mutateAsync(file);
  };

  const executeImport = async (importJobId: string) => {
    return executeImportMutation.mutateAsync(importJobId);
  };

  const activeImportJob = importStatusQuery.data ?? previewResult;

  return {
    backups: backupsQuery.data ?? [],
    backupStatus:
      (backupStatusQuery.data as BackupAutomationStatus | undefined) ?? null,
    isLoading: backupsQuery.isLoading,
    isStatusLoading: backupStatusQuery.isLoading,
    isRefreshing: backupsQuery.isFetching,
    isCreatingBackup: createManualBackupMutation.isPending,
    backupDownloadState: downloadState,
    isPreparingDownload,
    isDownloadActive,
    isPreviewingImport: previewImportMutation.isPending,
    isExecutingImport:
      executeImportMutation.isPending || activeImportJob?.status === "running",
    createManualBackup: () => createManualBackupMutation.mutateAsync(),
    refreshBackups: backupsQuery.refetch,
    openDownloadUrl: startDownload,
    previewImport,
    executeImport,
    previewResult: activeImportJob ?? null,
    importResult:
      (executeImportMutation.data as
        | BackupImportExecutionResponse
        | undefined) ?? null,
  };
}
