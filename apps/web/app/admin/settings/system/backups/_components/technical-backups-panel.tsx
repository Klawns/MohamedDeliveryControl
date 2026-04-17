'use client';

import {
  DatabaseBackup,
  Filter,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BackupDownloadState } from '@/hooks/use-backup-download';
import type {
  BackupJobSummary,
  SystemBackupSettingsResponse,
  UpdateSystemBackupSettingsInput,
} from '@/types/backups';
import {
  getSystemBackupFailoverSummary,
  getSystemBackupHealthLabel,
  getSystemBackupRetentionSummary,
  getSystemBackupScheduleSummary,
} from '../_mappers/system-backup-settings.presenter';
import { useTechnicalBackupsPanel } from '../_hooks/use-technical-backups-panel';
import { TechnicalBackupRow } from './technical-backup-row';
import { useState } from 'react';

interface TechnicalBackupsPanelProps {
  backups: BackupJobSummary[];
  systemSettings: SystemBackupSettingsResponse | null;
  isLoading: boolean;
  isSettingsLoading: boolean;
  errorMessage: string | null;
  settingsErrorMessage: string | null;
  isCreating: boolean;
  isSavingSettings: boolean;
  downloadState: BackupDownloadState;
  isPreparingDownload: boolean;
  isDownloadActive: (backupId: string) => boolean;
  onCreate: () => void;
  onSaveSettings: (input: UpdateSystemBackupSettingsInput) => void;
  onDownload: (backupId: string) => void;
}

export function TechnicalBackupsPanel({
  backups,
  systemSettings,
  isLoading,
  isSettingsLoading,
  errorMessage,
  settingsErrorMessage,
  isCreating,
  isSavingSettings,
  downloadState,
  isPreparingDownload,
  isDownloadActive,
  onCreate,
  onSaveSettings,
  onDownload,
}: TechnicalBackupsPanelProps) {
  const panel = useTechnicalBackupsPanel(backups);
  const createDisabled = isCreating || systemSettings?.enabled === false;

  return (
    <div className="space-y-6">
      <SystemBackupSettingsCard
        key={
          systemSettings
            ? JSON.stringify({
                enabled: systemSettings.enabled,
                schedule: systemSettings.schedule,
                retention: systemSettings.retention,
                failover: systemSettings.failover,
              })
            : 'system-backup-settings'
        }
        settings={systemSettings}
        isLoading={isSettingsLoading}
        errorMessage={settingsErrorMessage}
        isSaving={isSavingSettings}
        onSave={onSaveSettings}
      />

      <div className="flex flex-col gap-4 rounded-[2rem] border border-border-subtle bg-card/70 p-6 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="mb-1 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-info">
            <ShieldCheck size={14} /> Admin Area
          </div>
          <h1 className="text-xl font-bold text-foreground">
            Dumps Puros (PostgreSQL)
          </h1>
          <p className="text-sm text-muted-foreground">
            Historico e execucao de dumps completos para disaster recovery
            extremo.
          </p>
        </div>

        <Button
          className="bg-primary font-bold text-primary-foreground hover:bg-primary/90"
          disabled={createDisabled}
          onClick={onCreate}
        >
          <DatabaseBackup className="mr-2 h-4 w-4" />
          {isCreating
            ? 'Enfileirando...'
            : systemSettings?.enabled === false
              ? 'Desativado'
              : 'Gerar Dump Agora'}
        </Button>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-border-subtle bg-card/70 shadow-sm backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-border-subtle bg-background/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <Filter size={16} className="text-muted-foreground" />
            <select
              value={panel.statusFilter}
              onChange={(event) => panel.setStatusFilter(event.target.value)}
              className="bg-transparent text-sm font-medium text-foreground focus:outline-none"
              aria-label="Filtrar backups por status"
            >
              {panel.statusFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="text-border-subtle">|</span>
            <select
              value={panel.triggerFilter}
              onChange={(event) => panel.setTriggerFilter(event.target.value)}
              className="bg-transparent text-sm font-medium text-foreground focus:outline-none"
              aria-label="Filtrar backups por origem"
            >
              {panel.triggerFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm font-medium text-muted-foreground">
            {panel.filteredCount} registros
          </div>
        </div>

        <div className="p-0">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground animate-pulse">
              Carregando historico tecnico...
            </div>
          ) : errorMessage ? (
            <div className="m-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : panel.filteredCount === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              Nenhum dump compativel com o filtro.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border-subtle">
              <div className="hidden grid-cols-12 gap-4 bg-background/30 px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground md:grid">
                <div className="col-span-3">Data</div>
                <div className="col-span-2">Origem</div>
                <div className="col-span-3">Status</div>
                <div className="col-span-2 text-right">Tamanho</div>
                <div className="col-span-2 text-right">Acoes</div>
              </div>

              {panel.rows.map((backup) => (
                <TechnicalBackupRow
                  key={backup.id}
                  backup={backup}
                  downloadState={downloadState}
                  isPreparingDownload={isPreparingDownload}
                  isDownloadActive={isDownloadActive}
                  onDownload={onDownload}
                />
              ))}
            </div>
          )}
        </div>

        {panel.hasPagination ? (
          <div className="flex items-center justify-between border-t border-border-subtle bg-background/50 px-6 py-4">
            <span className="text-sm text-muted-foreground">
              Pagina{' '}
              <strong className="text-foreground">{panel.currentPage}</strong>{' '}
              de {panel.totalPages}
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-border-subtle hover:bg-hover-accent"
                onClick={panel.goToPreviousPage}
                disabled={panel.currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-border-subtle hover:bg-hover-accent"
                onClick={panel.goToNextPage}
                disabled={panel.currentPage === panel.totalPages}
              >
                Proxima
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface SystemBackupSettingsCardProps {
  settings: SystemBackupSettingsResponse | null;
  isLoading: boolean;
  errorMessage: string | null;
  isSaving: boolean;
  onSave: (input: UpdateSystemBackupSettingsInput) => void;
}

function SystemBackupSettingsCard({
  settings,
  isLoading,
  errorMessage,
  isSaving,
  onSave,
}: SystemBackupSettingsCardProps) {
  const [scheduleMode, setScheduleMode] = useState<
    UpdateSystemBackupSettingsInput['schedule']['mode']
  >(settings?.schedule.mode ?? 'fixed_time');
  const [fixedTime, setFixedTime] = useState(settings?.schedule.fixedTime ?? '04:00');
  const [intervalMinutes, setIntervalMinutes] = useState(
    String(settings?.schedule.intervalMinutes ?? 120),
  );
  const [retentionMode, setRetentionMode] = useState<
    UpdateSystemBackupSettingsInput['retention']['mode']
  >(settings?.retention.mode ?? 'count');
  const [maxCount, setMaxCount] = useState(String(settings?.retention.maxCount ?? 7));
  const [maxAgeDays, setMaxAgeDays] = useState(
    String(settings?.retention.maxAgeDays ?? 15),
  );

  if (isLoading) {
    return (
      <div className="rounded-[2rem] border border-border-subtle bg-card/70 p-6 text-sm text-muted-foreground shadow-sm backdrop-blur-xl">
        Carregando configuracao do backup sistêmico...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-[2rem] border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive shadow-sm backdrop-blur-xl">
        {errorMessage}
      </div>
    );
  }

  if (!settings) {
    return null;
  }

  const handleSave = () => {
    onSave({
      schedule: {
        mode: scheduleMode,
        fixedTime: scheduleMode === 'fixed_time' ? fixedTime : null,
        intervalMinutes:
          scheduleMode === 'interval'
            ? Number.parseInt(intervalMinutes, 10) || null
            : null,
      },
      retention: {
        mode: retentionMode,
        maxCount:
          retentionMode === 'count'
            ? Number.parseInt(maxCount, 10) || null
            : null,
        maxAgeDays:
          retentionMode === 'max_age'
            ? Number.parseInt(maxAgeDays, 10) || null
            : null,
      },
    });
  };

  return (
    <div className="rounded-[2rem] border border-border-subtle bg-card/70 p-6 shadow-sm backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-[0.1em] text-info">
            System Backup
          </div>
          <h2 className="text-xl font-bold text-foreground">
            Agendamento e Retencao do pg_dump
          </h2>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Provider ativo: <strong className="text-foreground">{settings.providerId}</strong></p>
            <p>{getSystemBackupHealthLabel(settings)}</p>
            <p>{getSystemBackupScheduleSummary(settings).summary}</p>
            <p>{getSystemBackupRetentionSummary(settings)}</p>
          </div>
          {settings.failover?.enabled ? (
            <div className="rounded-2xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
              {getSystemBackupFailoverSummary(settings)}
            </div>
          ) : null}
          {settings.enabled === false ? (
            <div className="rounded-2xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
              O kill switch `PG_DUMP_BACKUP_ENABLED=false` bloqueia execucoes manuais e agendadas neste ambiente.
            </div>
          ) : null}
        </div>

        <div className="grid w-full gap-4 lg:max-w-2xl lg:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-foreground">Modo de agendamento</span>
            <select
              value={scheduleMode}
              onChange={(event) =>
                setScheduleMode(
                  event.target.value as UpdateSystemBackupSettingsInput['schedule']['mode'],
                )
              }
              className="h-10 w-full rounded-xl border border-border-subtle bg-background/60 px-3 text-foreground"
              disabled={isSaving}
            >
              <option value="fixed_time">Horario fixo</option>
              <option value="interval">Intervalo</option>
              <option value="disabled">Desativado</option>
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-foreground">
              {scheduleMode === 'interval' ? 'Intervalo (minutos)' : 'Horario'}
            </span>
            {scheduleMode === 'interval' ? (
              <input
                value={intervalMinutes}
                onChange={(event) => setIntervalMinutes(event.target.value)}
                className="h-10 w-full rounded-xl border border-border-subtle bg-background/60 px-3 text-foreground"
                disabled={isSaving || scheduleMode !== 'interval'}
                inputMode="numeric"
              />
            ) : (
              <input
                type="time"
                value={fixedTime}
                onChange={(event) => setFixedTime(event.target.value)}
                className="h-10 w-full rounded-xl border border-border-subtle bg-background/60 px-3 text-foreground"
                disabled={isSaving || scheduleMode !== 'fixed_time'}
              />
            )}
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-foreground">Modo de retencao</span>
            <select
              value={retentionMode}
              onChange={(event) =>
                setRetentionMode(
                  event.target.value as UpdateSystemBackupSettingsInput['retention']['mode'],
                )
              }
              className="h-10 w-full rounded-xl border border-border-subtle bg-background/60 px-3 text-foreground"
              disabled={isSaving}
            >
              <option value="count">Quantidade de arquivos</option>
              <option value="max_age">Tempo maximo</option>
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-foreground">
              {retentionMode === 'count' ? 'Maximo de arquivos' : 'Maximo de dias'}
            </span>
            <input
              value={retentionMode === 'count' ? maxCount : maxAgeDays}
              onChange={(event) =>
                retentionMode === 'count'
                  ? setMaxCount(event.target.value)
                  : setMaxAgeDays(event.target.value)
              }
              className="h-10 w-full rounded-xl border border-border-subtle bg-background/60 px-3 text-foreground"
              disabled={isSaving}
              inputMode="numeric"
            />
          </label>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          className="bg-primary font-bold text-primary-foreground hover:bg-primary/90"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Salvando...' : 'Salvar Configuracao'}
        </Button>
      </div>
    </div>
  );
}
