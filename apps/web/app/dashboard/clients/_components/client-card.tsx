'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Bike,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Trash2,
  User,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SelectableCardShell } from '@/components/ride-selection/selectable-card-shell';
import { SelectionCheckbox } from '@/components/ride-selection/selection-checkbox';
import { cn } from '@/lib/utils';
import { Client } from '@/types/rides';

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onPin: (client: Client) => void;
  onQuickRide: (client: Client) => void;
  onViewHistory: (client: Client) => void;
  selection?: {
    isSelectionMode: boolean;
    isSelected: boolean;
    onEnterSelectionMode: (clientId?: string) => void;
    onToggleSelection: (clientId: string) => void;
    selectionDisabled?: boolean;
    canEnterSelectionWithLongPress?: boolean;
  };
}

function getClientMetaItems(client: Client) {
  const phone = client.phone?.trim() || 'Telefone nao informado';
  const address = client.address?.trim() || 'Endereco nao informado';

  return [phone, address];
}

export const ClientCard = React.memo(function ClientCard({
  client,
  onEdit,
  onDelete,
  onPin,
  onQuickRide,
  onViewHistory,
  selection,
}: ClientCardProps) {
  const clientName = client.name?.trim() || 'Sem nome';
  const metaItems = getClientMetaItems(client);
  const isSelectionMode = selection?.isSelectionMode ?? false;
  const isSelected = selection?.isSelected ?? false;

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 10 }}>
      <SelectableCardShell
        className={cn(
          'rounded-[1.6rem] border border-border-subtle bg-card-background p-4 shadow-sm transition-shadow hover:shadow-md',
          !isSelectionMode && 'cursor-pointer',
          isSelectionMode && isSelected && 'border-blue-500/40 bg-blue-500/5 ring-1 ring-blue-500/20',
        )}
        isSelectionMode={isSelectionMode}
        isSelected={isSelected}
        selectionDisabled={selection?.selectionDisabled}
        canEnterSelectionWithLongPress={selection?.canEnterSelectionWithLongPress}
        onEnterSelectionMode={() => selection?.onEnterSelectionMode(client.id)}
        onToggleSelection={() => selection?.onToggleSelection(client.id)}
      >
        <article
          onClick={() => {
            if (!isSelectionMode) {
              onViewHistory(client);
            }
          }}
          className="group"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-4">
              {isSelectionMode ? (
                <div
                  data-selection-ignore="true"
                  className="mt-1"
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  <SelectionCheckbox
                    checked={isSelected}
                    onToggle={() => selection?.onToggleSelection(client.id)}
                    ariaLabel={`Selecionar cliente ${clientName}`}
                    disabled={selection?.selectionDisabled}
                  />
                </div>
              ) : null}

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary transition-colors group-hover:border-primary/20 group-hover:bg-primary/12">
                <User size={20} />
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="min-w-0 flex-1 truncate font-display text-xl font-extrabold tracking-tight text-text-primary sm:text-2xl">
                    {clientName}
                  </h3>

                  {client.isPinned ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                      <Pin className="size-3" />
                      Fixado
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                  {metaItems.map((item, index) => (
                    <React.Fragment key={`${client.id}-${index}`}>
                      {index > 0 ? <span aria-hidden="true">&middot;</span> : null}
                      <span className="truncate">{item}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {!isSelectionMode ? (
              <div className="flex items-center justify-between gap-3 border-t border-border-subtle/70 pt-3">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onViewHistory(client);
                  }}
                  className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
                >
                  Ver detalhes
                  <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </button>

                <div
                  data-selection-ignore="true"
                  className="flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onQuickRide(client);
                    }}
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-border-subtle bg-background px-3.5 text-sm font-medium text-text-primary transition-colors hover:border-border hover:bg-hover-accent"
                    title="Nova corrida"
                  >
                    <Bike className="size-4" />
                    <span className="hidden sm:inline">Nova corrida</span>
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-background text-text-secondary transition-colors hover:border-border hover:bg-hover-accent hover:text-text-primary"
                        title="Abrir acoes do cliente"
                        aria-label={`Abrir menu de acoes para ${clientName}`}
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      className="min-w-48 rounded-2xl border-border-subtle bg-card-background p-1.5"
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                    >
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault();
                          onEdit(client);
                        }}
                        className="rounded-xl font-medium text-text-primary"
                      >
                        <Pencil size={14} />
                        Editar
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault();
                          onPin(client);
                        }}
                        className="rounded-xl font-medium text-text-primary"
                      >
                        {client.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                        {client.isPinned ? 'Desafixar' : 'Fixar'}
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={(event) => {
                          event.preventDefault();
                          onDelete(client);
                        }}
                        className="rounded-xl font-medium"
                      >
                        <Trash2 size={14} />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ) : null}
          </div>
        </article>
      </SelectableCardShell>
    </motion.div>
  );
});

ClientCard.displayName = 'ClientCard';
