'use client';

import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { parseApiError } from '@/lib/api-error';
import type { BackupDownloadResponse } from '@/types/backups';

const SUCCESS_FEEDBACK_DURATION_MS = 3200;
const FAILURE_FEEDBACK_DURATION_MS = 4200;

export type BackupDownloadPhase = 'idle' | 'requesting' | 'started' | 'failed';

export interface BackupDownloadState {
  backupId: string | null;
  phase: BackupDownloadPhase;
  message: string | null;
}

interface UseBackupDownloadOptions {
  requestDownloadUrl: (backupId: string) => Promise<BackupDownloadResponse>;
  successTitle: string;
  successDescription: string;
  errorTitle: string;
  errorDescription: string;
}

const IDLE_DOWNLOAD_STATE: BackupDownloadState = {
  backupId: null,
  phase: 'idle',
  message: null,
};

function triggerBrowserDownload(url: string) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.rel = 'noopener noreferrer';
  anchor.download = '';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function useBackupDownload({
  requestDownloadUrl,
  successTitle,
  successDescription,
  errorTitle,
  errorDescription,
}: UseBackupDownloadOptions) {
  const { toast } = useToast();
  const resetTimerRef = useRef<number | null>(null);
  const [downloadState, setDownloadState] =
    useState<BackupDownloadState>(IDLE_DOWNLOAD_STATE);

  const clearResetTimer = () => {
    if (resetTimerRef.current === null) {
      return;
    }

    window.clearTimeout(resetTimerRef.current);
    resetTimerRef.current = null;
  };

  const scheduleReset = (delayMs: number) => {
    clearResetTimer();
    resetTimerRef.current = window.setTimeout(() => {
      setDownloadState(IDLE_DOWNLOAD_STATE);
      resetTimerRef.current = null;
    }, delayMs);
  };

  useEffect(() => clearResetTimer, []);

  const startDownload = async (backupId: string) => {
    if (downloadState.phase === 'requesting') {
      return;
    }

    clearResetTimer();
    setDownloadState({
      backupId,
      phase: 'requesting',
      message: 'Estamos preparando o arquivo para iniciar o download.',
    });

    try {
      const response = await requestDownloadUrl(backupId);
      triggerBrowserDownload(response.url);
      setDownloadState({
        backupId,
        phase: 'started',
        message: successDescription,
      });
      toast({
        title: successTitle,
        description: successDescription,
      });
      scheduleReset(SUCCESS_FEEDBACK_DURATION_MS);
    } catch (error) {
      const message = parseApiError(error, errorDescription);
      setDownloadState({
        backupId,
        phase: 'failed',
        message,
      });
      toast({
        title: errorTitle,
        description: message,
        variant: 'destructive',
      });
      scheduleReset(FAILURE_FEEDBACK_DURATION_MS);
    }
  };

  const isPreparingDownload = downloadState.phase === 'requesting';
  const isDownloadActive = (backupId: string) =>
    downloadState.backupId === backupId &&
    (downloadState.phase === 'requesting' || downloadState.phase === 'started');

  return {
    downloadState,
    isPreparingDownload,
    isDownloadActive,
    startDownload,
  };
}
