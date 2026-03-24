"use client";

export function StatsSkeleton() {
    return (
        <div className="grid grid-cols-2 gap-4 w-full">
            <div className="col-span-2 p-5 rounded-3xl bg-card/40 border border-border flex flex-col gap-2 animate-pulse">
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-8 w-32 bg-muted rounded-lg" />
            </div>
            <div className="p-4 rounded-3xl bg-card/40 border border-border flex flex-col gap-2 animate-pulse">
                <div className="h-2 w-16 bg-muted rounded" />
                <div className="h-6 w-24 bg-muted rounded-lg" />
            </div>
            <div className="p-4 rounded-3xl bg-card/40 border border-border flex flex-col gap-2 animate-pulse">
                <div className="h-2 w-16 bg-muted rounded" />
                <div className="h-6 w-24 bg-muted rounded-lg" />
            </div>
        </div>
    );
}
