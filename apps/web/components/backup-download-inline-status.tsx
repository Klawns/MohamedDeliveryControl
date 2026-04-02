'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { BackupDownloadState } from '@/hooks/use-backup-download';
import { cn } from '@/lib/utils';

interface BackupDownloadInlineStatusProps {
  state: BackupDownloadState;
  isVisible: boolean;
  className?: string;
}

function getDownloadTone(phase: BackupDownloadState['phase']) {
  switch (phase) {
    case 'requesting':
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        title: 'Preparando download',
        containerClassName: 'border-info/15 bg-info/5 text-info',
        railClassName: 'bg-info/12',
        barClassName:
          'bg-gradient-to-r from-info/35 via-info to-info/35 shadow-[0_0_14px_rgba(59,130,246,0.25)]',
      };
    case 'started':
      return {
        icon: <CheckCircle2 className="h-4 w-4" />,
        title: 'Download iniciado',
        containerClassName: 'border-success/15 bg-success/5 text-success',
        railClassName: 'bg-success/12',
        barClassName: 'bg-success shadow-[0_0_12px_rgba(34,197,94,0.2)]',
      };
    case 'failed':
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        title: 'Falha ao iniciar download',
        containerClassName:
          'border-destructive/15 bg-destructive/5 text-destructive',
        railClassName: 'bg-destructive/12',
        barClassName:
          'bg-destructive shadow-[0_0_12px_rgba(239,68,68,0.15)]',
      };
    default:
      return null;
  }
}

export function BackupDownloadInlineStatus({
  state,
  isVisible,
  className,
}: BackupDownloadInlineStatusProps) {
  const tone = getDownloadTone(state.phase);

  return (
    <AnimatePresence initial={false}>
      {isVisible && tone ? (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -6 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -6 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className={cn('overflow-hidden', className)}
          aria-live="polite"
        >
          <div
            className={cn(
              'rounded-xl border px-3 py-3 sm:px-4',
              tone.containerClassName,
            )}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">{tone.icon}</div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{tone.title}</div>
                <p className="mt-1 text-sm text-current/75">{state.message}</p>
              </div>
            </div>

            <div
              className={cn(
                'relative mt-3 h-1.5 overflow-hidden rounded-full',
                tone.railClassName,
              )}
            >
              {state.phase === 'requesting' ? (
                <motion.div
                  className={cn(
                    'absolute inset-y-0 left-0 w-2/5 rounded-full',
                    tone.barClassName,
                  )}
                  animate={{ x: ['-110%', '230%'] }}
                  transition={{
                    duration: 1.2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                  }}
                />
              ) : (
                <motion.div
                  className={cn('h-full rounded-full', tone.barClassName)}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                />
              )}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
