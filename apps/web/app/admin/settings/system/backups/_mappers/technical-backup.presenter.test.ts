import assert from 'node:assert/strict';
import test from 'node:test';
import { getTechnicalBackupRowPresentation } from './technical-backup.presenter';

test('builds download feedback and retry copy for the matching backup', () => {
  const presentation = getTechnicalBackupRowPresentation(
    {
      id: 'backup-1',
      kind: 'technical_full',
      trigger: 'scheduled',
      status: 'success',
      checksum: '1234567890abcdef1234567890abcdef',
      sizeBytes: 0,
      manifestVersion: 2,
      errorMessage: null,
      warnings: [
        'Upload concluido via fallback no provider r2 apos falha no provider rclone_drive.',
      ],
      displayName: 'technical-backup-r2-fallback-2026-04-01T10-00-00-000Z.sql.gz',
      createdAt: '2026-04-01T10:00:00.000Z',
      startedAt: null,
      finishedAt: null,
      metadata: null,
    },
    {
      downloadState: {
        backupId: 'backup-1',
        phase: 'failed',
        message: 'falhou',
      },
      isPreparingDownload: false,
      isDownloadActive: () => false,
    },
  );

  assert.equal(presentation.triggerLabel, 'Agendada');
  assert.equal(presentation.status.label, 'Concluido');
  assert.equal(presentation.sizeLabel, '0.00 MB');
  assert.equal(presentation.download.label, 'Tentar novamente');
  assert.equal(presentation.download.isDisabled, false);
  assert.equal(presentation.download.isFeedbackVisible, true);
  assert.equal(
    presentation.details.displayName,
    'technical-backup-r2-fallback-2026-04-01T10-00-00-000Z.sql.gz',
  );
  assert.equal(
    presentation.details.warningMessage,
    'Upload concluido via fallback no provider r2 apos falha no provider rclone_drive.',
  );
  assert.equal(presentation.details.checksumLabel, '1234567890abcdef...');
  assert.equal(
    presentation.details.checksumTitle,
    '1234567890abcdef1234567890abcdef',
  );
});

test('disables download for backups that are not successful', () => {
  const presentation = getTechnicalBackupRowPresentation(
    {
      id: 'backup-2',
      kind: 'technical_full',
      trigger: 'manual',
      status: 'running',
      checksum: null,
      sizeBytes: null,
      manifestVersion: 1,
      errorMessage: 'erro',
      warnings: [],
      displayName: null,
      createdAt: 'invalid',
      startedAt: null,
      finishedAt: null,
      metadata: null,
    },
    {
      downloadState: {
        backupId: null,
        phase: 'idle',
        message: null,
      },
      isPreparingDownload: false,
      isDownloadActive: () => false,
    },
  );

  assert.equal(presentation.createdAtLabel, 'Data indisponivel');
  assert.equal(presentation.status.label, 'Em progresso');
  assert.equal(presentation.download.isDisabled, true);
  assert.equal(presentation.details.checksumLabel, 'Checksum indisponivel');
});
