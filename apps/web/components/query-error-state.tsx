'use client';

import { AlertCircle, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { parseApiError } from '@/lib/api-error';
import { cn } from '@/lib/utils';

interface QueryErrorStateProps {
  error: unknown;
  title: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
  fullHeight?: boolean;
}

export function QueryErrorState({
  error,
  title,
  description,
  retryLabel = 'Tentar novamente',
  onRetry,
  className,
  fullHeight = false,
}: QueryErrorStateProps) {
  return (
    <div
      className={cn(
        'flex w-full items-center justify-center',
        fullHeight && 'min-h-[50vh]',
        className,
      )}
    >
      <Alert
        variant="destructive"
        className="max-w-3xl border-destructive/30 bg-destructive/5"
      >
        <AlertCircle className="mt-0.5" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>
          <p>{description ?? parseApiError(error)}</p>
          {onRetry ? (
            <Button
              type="button"
              variant="outline"
              onClick={onRetry}
              className="mt-3 border-destructive/30 bg-background text-foreground hover:bg-destructive/10"
            >
              <RotateCcw className="size-4" />
              {retryLabel}
            </Button>
          ) : null}
        </AlertDescription>
      </Alert>
    </div>
  );
}
