'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  FileArchive,
  Loader2,
  UploadCloud,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ConfirmDangerousActionModal } from '@/components/confirm-dangerous-action-modal';
import { useAuth } from '@/hooks/use-auth';
import type { BackupImportJobResponse } from '@/types/backups';

interface BackupImportCardProps {
  preview: BackupImportJobResponse | null;
  isPreviewing: boolean;
  isExecuting: boolean;
  onPreview: (file: File) => Promise<unknown>;
  onExecute: (importJobId: string) => Promise<unknown>;
}

export function BackupImportCard({
  preview,
  isPreviewing,
  isExecuting,
  onPreview,
  onExecute,
}: BackupImportCardProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const ownerDisplayName = preview
    ? preview.preview.ownerName?.trim() ||
      (preview.preview.ownerUserId === user?.id ? user.name : null) ||
      'Usuario nao identificado'
    : null;

  useEffect(() => {
    if (!preview) {
      setSelectedFileName(null);
    }
  }, [preview]);

  useEffect(() => {
    if (preview?.status === 'running') {
      setIsOpen(true);
    }
  }, [preview?.status]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);

    try {
      await onPreview(file);
    } catch {
      setSelectedFileName(null);
    } finally {
      event.target.value = '';
    }
  };

  const handleExecute = async () => {
    if (!preview) return;
    setIsConfirmModalOpen(true);
  };

  const handleConfirmRestore = async () => {
    if (!preview) return;

    try {
      await onExecute(preview.id);
      setIsConfirmModalOpen(false);
      setIsOpen(false);
      setSelectedFileName(null);
    } catch {
      // The mutation layer already shows a toast; keep the modal open for retry.
    }
  };

  const executionPhase =
    preview?.status === 'running' ? preview.phase : null;
  const step = executionPhase
    ? executionPhase === 'backing_up'
      ? 3
      : 4
    : preview
      ? 2
      : 1;
  const executeButtonLabel = !isExecuting
    ? 'Confirmar e Restaurar'
    : executionPhase === 'backing_up'
      ? 'Gerando backup de seguranca...'
      : 'Importando dados...';

  return (
    <div className="overflow-hidden rounded-[2rem] border border-destructive/20 bg-destructive/5 transition-colors">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-destructive/10"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-destructive">
              Restaurar sistema a partir de um backup
            </h3>
            <p className="mt-0.5 text-sm font-medium text-destructive/80">
              Operacao de alto risco. Destroi os dados atuais.
            </p>
          </div>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-destructive transition-transform duration-300 ${
            isOpen ? '-rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="border-t border-destructive/20 p-6 pt-2">
              <div className="mb-6 space-y-2">
                <p className="max-w-3xl text-sm leading-6 text-foreground/80">
                  A restauracao ira{' '}
                  <strong className="font-bold text-destructive">
                    apagar todos os dados atuais da sua operacao
                  </strong>{' '}
                  e substitui-los pelo conteudo do backup selecionado.
                  Certifique-se de que ninguem esta utilizando o sistema
                  durante este processo.
                </p>
              </div>

              <div className="space-y-6">
                <div
                  className={`relative flex gap-4 ${
                    step > 1 ? 'opacity-60 grayscale' : ''
                  }`}
                >
                  <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive text-sm font-bold text-destructive-foreground">
                    {step > 1 ? <CheckCircle2 className="h-4 w-4" /> : '1'}
                  </div>
                  {step === 1 && (
                    <div className="absolute left-4 top-8 -bottom-10 z-0 w-[2px] bg-border-subtle" />
                  )}

                  <div className="flex-1 pb-4">
                    <h4 className="mb-3 font-semibold text-foreground">
                      1. Selecionar arquivo de backup (.zip)
                    </h4>
                    <div className="rounded-2xl border border-dashed border-border-subtle bg-background/40 p-5">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".zip,application/zip"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                            <FileArchive className="h-4 w-4 text-primary" />
                            Arquivo selecionado
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {selectedFileName ?? 'Nenhum'}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          className="border-border-subtle bg-background/50 hover:bg-hover-accent"
                          disabled={isPreviewing || isExecuting}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <UploadCloud className="mr-2 h-4 w-4" />
                          {isPreviewing ? 'Validando...' : 'Fazer upload'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {(step === 2 || preview) && (
                  <div className="relative flex gap-4 animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning text-sm font-bold text-warning-foreground">
                      {step > 2 ? <CheckCircle2 className="h-4 w-4" /> : '2'}
                    </div>

                    <div className="flex-1">
                      <h4 className="mb-3 font-semibold text-foreground">
                        2. Revisao e Confirmacao
                      </h4>

                      {preview && (
                        <div className="space-y-4 rounded-2xl border border-warning/20 bg-warning/10 p-5">
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                              Dono original do backup:{' '}
                              <strong className="text-foreground">
                                {ownerDisplayName}
                              </strong>
                              <br />
                              Criado em:{' '}
                              <strong className="text-foreground">
                                {new Date(preview.preview.createdAt).toLocaleString(
                                  'pt-BR',
                                )}
                              </strong>
                            </p>
                            <div className="rounded-xl border border-border-subtle bg-background/50 px-3 py-3 text-xs font-medium text-foreground/80">
                              Ao confirmar, o sistema primeiro gera um backup de
                              seguranca do estado atual e, em seguida, aplica os
                              dados do arquivo selecionado.
                            </div>
                          </div>

                          {preview.preview.warnings.length > 0 && (
                            <div className="mb-4 space-y-2">
                              {preview.preview.warnings.map((warning) => (
                                <div
                                  key={warning}
                                  className="rounded-xl border border-warning/20 bg-background/50 px-3 py-2 text-xs font-medium text-foreground"
                                >
                                  {warning}
                                </div>
                              ))}
                            </div>
                          )}

                          {preview.status === 'failed' && preview.errorMessage && (
                            <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-3 text-xs font-medium text-destructive">
                              {preview.errorMessage}
                            </div>
                          )}

                          <div className="flex justify-start">
                            <Button
                              variant="destructive"
                              className="w-full font-bold sm:w-auto"
                              disabled={isExecuting}
                              onClick={handleExecute}
                            >
                              {executeButtonLabel}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {isExecuting && (
                  <>
                    <div className="relative flex gap-4 animate-in slide-in-from-top-4 fade-in duration-300">
                      <div
                        className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          executionPhase === 'importing'
                            ? 'bg-success text-success-foreground'
                            : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        {executionPhase === 'importing' ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>

                      <div className="flex-1">
                        <h4 className="mb-2 font-semibold text-foreground">
                          3. Gerando backup de seguranca
                        </h4>
                        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground/80">
                          O estado atual do sistema esta sendo salvo antes da
                          restauracao.
                        </div>
                      </div>
                    </div>

                    <div className="relative flex gap-4 animate-in slide-in-from-top-4 fade-in duration-300">
                      <div
                        className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          executionPhase === 'importing'
                            ? 'bg-warning text-warning-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {executionPhase === 'importing' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          '4'
                        )}
                      </div>

                      <div className="flex-1">
                        <h4 className="mb-2 font-semibold text-foreground">
                          4. Importando dados do backup
                        </h4>
                        <div className="rounded-2xl border border-warning/20 bg-warning/10 p-4 text-sm text-foreground/80">
                          Depois do backup de seguranca, os dados do arquivo
                          sao aplicados no sistema.
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDangerousActionModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmRestore}
        isLoading={isExecuting}
        title="Restaurar Backup?"
        description="Antes de restaurar, sera gerado um backup de seguranca do estado atual. Depois disso, os dados atuais serao apagados e substituidos pelo conteudo deste backup. Esta acao e irreversivel."
        requiredText="RESTAURAR"
      />
    </div>
  );
}
