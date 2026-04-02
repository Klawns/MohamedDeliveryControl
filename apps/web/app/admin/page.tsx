"use client";

import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { adminKeys } from "@/lib/query-keys";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import { QueryErrorState } from "@/components/query-error-state";
import { DeleteUserModal } from "./components/delete-user-modal";
import { CreateUserModal } from "./components/create-user-modal";
import { useAdminDashboard } from "./_hooks/use-admin-dashboard";
import { useAdminAccess } from "./_hooks/use-admin-access";
import { useAdminDashboardState } from "./_hooks/use-admin-dashboard-state";
import { AdminStatsGrid } from "./components/admin-stats-grid";
import { RecentUsersTable } from "./components/recent-users-table";

export default function AdminDashboardPage() {
    const { isLoading, isAdmin, isAuthError, authError } = useAdminAccess();
    const queryClient = useQueryClient();
    const state = useAdminDashboardState();

    const {
        stats,
        users,
        pagination,
        statsError,
        usersError,
        isStatsPending,
        isUsersPending,
        refetchStats,
        refetchUsers,
        isUpdatingUserPlan,
        handleDeleteUser,
        handleUpdateUserPlan,
    } = useAdminDashboard(state.currentPage, isAdmin);

    const resolvedUsers = users ?? [];
    const resolvedPagination = pagination ?? {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
    };

    if (isAuthError && authError) {
        return (
            <QueryErrorState
                error={authError}
                title="Nao foi possivel validar o acesso administrativo"
                description="A autenticacao do painel falhou por uma indisponibilidade operacional."
                onRetry={() => window.location.reload()}
                fullHeight
            />
        );
    }

    if (isLoading || !isAdmin) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                <div className="animate-pulse text-lg font-medium tracking-tight">
                    Validando acesso restrito...
                </div>
            </div>
        );
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10 fade-in"
            >
                <QueryErrorBoundary message="Nao foi possivel carregar as estatisticas do painel.">
                    {statsError && !stats ? (
                        <QueryErrorState
                            error={statsError}
                            title="Nao foi possivel carregar as estatisticas do painel"
                            onRetry={() => {
                                void refetchStats();
                            }}
                        />
                    ) : (
                        <div className="space-y-4">
                            {statsError ? (
                                <QueryErrorState
                                    error={statsError}
                                    title="Falha ao atualizar as estatisticas"
                                    description="Os dados em cache foram mantidos, mas a ultima atualizacao falhou."
                                    onRetry={() => {
                                        void refetchStats();
                                    }}
                                />
                            ) : null}

                            {stats ? <AdminStatsGrid stats={stats} /> : null}

                            {isStatsPending && !stats ? (
                                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                                    {[1, 2, 3].map((item) => (
                                        <div
                                            key={item}
                                            className="h-40 animate-pulse rounded-[2rem] border border-white/5 bg-slate-900/40"
                                        />
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    )}
                </QueryErrorBoundary>

                <div className="w-full">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                        <QueryErrorBoundary message="Nao foi possivel carregar a lista de usuarios.">
                            {usersError && !users ? (
                                <QueryErrorState
                                    error={usersError}
                                    title="Nao foi possivel carregar a lista de usuarios"
                                    onRetry={() => {
                                        void refetchUsers();
                                    }}
                                />
                            ) : (
                                <div className="space-y-4">
                                    {usersError ? (
                                        <QueryErrorState
                                            error={usersError}
                                            title="Falha ao atualizar a lista de usuarios"
                                            description="Os dados em cache foram mantidos, mas a ultima consulta falhou."
                                            onRetry={() => {
                                                void refetchUsers();
                                            }}
                                        />
                                    ) : null}

                                    <RecentUsersTable
                                        users={resolvedUsers}
                                        pagination={resolvedPagination}
                                        currentPage={state.currentPage}
                                        isLoading={isUsersPending}
                                        isUpdatingPlan={isUpdatingUserPlan}
                                        onCreateUser={state.openCreateModal}
                                        onDeleteUser={state.openDeleteModal}
                                        onUpdatePlan={handleUpdateUserPlan}
                                        onPreviousPage={state.previousPage}
                                        onNextPage={() => state.nextPage(resolvedPagination.totalPages)}
                                    />
                                </div>
                            )}
                        </QueryErrorBoundary>
                    </motion.div>
                </div>
            </motion.div>

            <CreateUserModal
                key={state.isCreateModalOpen ? "create-open" : "create-closed"}
                open={state.isCreateModalOpen}
                onOpenChange={state.setIsCreateModalOpen}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: adminKeys.usersAll() });
                    queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
                }}
            />

            <DeleteUserModal
                key={state.userToDelete?.id ?? "delete-none"}
                user={state.userToDelete}
                open={state.isDeleteModalOpen}
                onOpenChange={state.setIsDeleteModalOpen}
                onConfirm={handleDeleteUser}
            />
        </>
    );
}
