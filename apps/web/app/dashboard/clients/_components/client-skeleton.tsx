'use client';

export function ClientSkeleton() {
  return (
    <div className="rounded-[1.6rem] border border-border-subtle bg-card-background p-4 shadow-sm animate-pulse">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-7 w-2/5 rounded-lg bg-muted/40" />
            <div className="h-4 w-4/5 rounded-md bg-muted/40" />
          </div>

          <div className="h-9 w-9 rounded-full bg-muted/40" />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border-subtle/70 pt-3">
          <div className="h-4 w-24 rounded-md bg-muted/40" />
          <div className="h-4 w-40 rounded-md bg-muted/30" />
        </div>
      </div>
    </div>
  );
}
