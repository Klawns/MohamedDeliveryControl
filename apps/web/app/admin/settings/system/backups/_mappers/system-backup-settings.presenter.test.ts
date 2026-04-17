import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getSystemBackupFailoverSummary,
  getSystemBackupHealthLabel,
  getSystemBackupRetentionSummary,
  getSystemBackupScheduleSummary,
} from './system-backup-settings.presenter';

test('summarizes fixed-time schedules for the admin panel', () => {
  assert.equal(
    getSystemBackupScheduleSummary({
      enabled: true,
      schedule: {
        mode: 'fixed_time',
        fixedTime: '04:00',
        intervalMinutes: null,
      },
    }).summary,
    'Todos os dias as 04:00',
  );
});

test('summarizes interval schedules for the admin panel', () => {
  assert.equal(
    getSystemBackupScheduleSummary({
      enabled: true,
      schedule: {
        mode: 'interval',
        fixedTime: null,
        intervalMinutes: 120,
      },
    }).summary,
    'A cada 120 minutos',
  );
});

test('builds human-readable retention and health labels', () => {
  assert.equal(
    getSystemBackupRetentionSummary({
      retention: {
        mode: 'max_age',
        maxCount: null,
        maxAgeDays: 15,
      },
    }),
    'Arquivos com no maximo 15 dias',
  );
  assert.equal(
    getSystemBackupHealthLabel({
      enabled: false,
      scheduler: {
        health: 'disabled',
      },
    }),
    'Desativado por ambiente',
  );
});

test('summarizes explicit failover configuration and the last fallback incident', () => {
  assert.equal(
    getSystemBackupFailoverSummary({
      failover: {
        enabled: true,
        primaryProviderId: 'rclone_drive',
        fallbackProviderId: 'r2',
        lastFallbackAt: '2026-04-17T12:10:00.000Z',
        lastFallbackBackupId: 'backup-123',
        lastFallbackReason: 'Falha ao enviar dump para o Google Drive.',
      },
    }),
    'Failover ativo: rclone_drive -> r2. Ultimo fallback em 17/04/2026, 09:10: Falha ao enviar dump para o Google Drive.',
  );
});
