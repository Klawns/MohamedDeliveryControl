"use client";

import { Clock } from "lucide-react";
import { RefObject } from "react";
import { DashboardCompactRidesContainer } from "@/components/ui/dashboard-compact-rides-container";
import { RideViewModel } from "../types";
import { RideListSkeleton } from "./ride-list-skeleton";
import { RecentRideCard } from "./recent-ride-card";

interface RecentRidesListProps {
    rides: RideViewModel[];
    onEdit: (ride: RideViewModel) => void;
    onDelete: (ride: RideViewModel) => void;
    onChangePaymentStatus: (ride: RideViewModel, status: 'PAID' | 'PENDING') => void | Promise<unknown>;
    isPaymentUpdating: (rideId: string) => boolean;
    isLoading: boolean;
    hasMore: boolean;
    onLoadMore: () => void;
    error: unknown;
    retry: () => void;
    scrollRootRef?: RefObject<HTMLElement | null>;
}

export function RecentRidesList({
    rides,
    onEdit,
    onDelete,
    onChangePaymentStatus,
    isPaymentUpdating,
    isLoading,
    hasMore,
    onLoadMore,
    error,
    retry,
    scrollRootRef,
}: RecentRidesListProps) {
    return (
        <section className="flex min-h-[300px] flex-col overflow-hidden rounded-3xl border border-border-subtle bg-card-background p-4 shadow-sm">
            <div className="mb-4 flex flex-shrink-0 items-center justify-between px-2">
                <h2 className="flex items-center gap-2 text-lg font-display font-extrabold text-text-primary">
                    <Clock size={18} className="text-primary" />
                    Corridas Recentes
                </h2>
                {isLoading && rides.length > 0 ? (
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                ) : null}
            </div>

            {isLoading && rides.length === 0 ? (
                <RideListSkeleton count={3} />
            ) : rides.length === 0 ? (
                <EmptyRecentRidesState />
            ) : (
                <DashboardCompactRidesContainer
                    items={rides}
                    containerRef={scrollRootRef}
                    hasMore={hasMore}
                    isLoading={isLoading}
                    onLoadMore={onLoadMore}
                    error={error}
                    retry={retry}
                    gap={12}
                    scrollBoundaryMode="handoff"
                    renderItem={(ride: RideViewModel) => (
                        <RecentRideCard
                            key={ride.id}
                            ride={ride}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onChangePaymentStatus={onChangePaymentStatus}
                            isPaymentUpdating={isPaymentUpdating(ride.id)}
                        />
                    )}
                />
            )}
        </section>
    );
}

function EmptyRecentRidesState() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center py-12 opacity-20">
            <span className="text-4xl font-display font-black italic tracking-widest text-text-primary">
                ROTTA
            </span>
            <p className="mt-2 text-[10px] font-display font-bold uppercase tracking-widest">
                Nenhuma corrida encontrada
            </p>
        </div>
    );
}
