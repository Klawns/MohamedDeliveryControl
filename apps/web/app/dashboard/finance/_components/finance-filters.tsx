'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ClientAutocompleteField } from '@/components/ui/client-autocomplete-field';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  financePaymentStatusOptions,
  type FinancePaymentStatusFilter,
} from '@/services/finance-service';
import { type FinanceClientAutocompleteState } from '../_hooks/use-finance-client-autocomplete';
import { financeMotion } from '../_lib/finance-motion';
import { PERIODS, type PeriodId } from '../_types';

interface FinanceFiltersProps {
  clientAutocomplete: FinanceClientAutocompleteState;
  selectedPeriod: PeriodId;
  setSelectedPeriod: (period: PeriodId) => void;
  selectedPaymentStatus: FinancePaymentStatusFilter;
  setSelectedPaymentStatus: (status: FinancePaymentStatusFilter) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
}

function ClientFilterHint({ clientName }: { clientName?: string | null }) {
  if (!clientName) {
    return null;
  }

  return (
    <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full border border-border-subtle bg-card-background px-3 py-1.5 text-xs font-medium text-text-secondary">
      <span className="size-1.5 shrink-0 rounded-full bg-primary" />
      <span className="truncate">
        Exibindo <strong className="font-semibold text-text-primary">{clientName}</strong>
      </span>
    </div>
  );
}

interface SegmentedControlOption {
  value: string;
  label: string;
  activeClassName: string;
  activeTextClassName?: string;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  layoutId: string;
  className?: string;
  buttonClassName?: string;
  inactiveTextClassName?: string;
}

function SegmentedControl({
  options,
  selectedValue,
  onSelect,
  layoutId,
  className,
  buttonClassName,
  inactiveTextClassName = 'text-text-muted hover:text-text-primary',
}: SegmentedControlProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        'flex w-full overflow-x-auto rounded-2xl border border-border-subtle bg-card-background p-1 shadow-inner no-scrollbar',
        className,
      )}
    >
      {options.map((option) => {
        const isActive = selectedValue === option.value;

        return (
          <motion.button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
            className={cn(
              'relative isolate whitespace-nowrap rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] transition-colors duration-200',
              buttonClassName,
              isActive
                ? option.activeTextClassName || 'text-white'
                : inactiveTextClassName,
            )}
          >
            {isActive ? (
              <motion.span
                layoutId={layoutId}
                transition={shouldReduceMotion ? { duration: 0 } : financeMotion.feedback}
                className={cn(
                  'absolute inset-0 rounded-[inherit] shadow-[0_16px_32px_-24px_rgba(15,23,42,0.38)]',
                  option.activeClassName,
                )}
              />
            ) : null}
            <span className="relative z-10">{option.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

export function FinanceFilters({
  clientAutocomplete,
  selectedPeriod,
  setSelectedPeriod,
  selectedPaymentStatus,
  setSelectedPaymentStatus,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: FinanceFiltersProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const periodOptions = PERIODS.map((period) => ({
    value: period.id,
    label: period.label,
    activeClassName: period.color,
    activeTextClassName: period.id === 'year' ? 'text-slate-950' : 'text-white',
  }));
  const paymentStatusControlOptions = financePaymentStatusOptions.map((option) => ({
    value: option.value,
    label: option.label,
    activeClassName: 'bg-foreground/95',
    activeTextClassName: 'text-background',
  }));

  return (
    <div className="sticky top-3 z-20 space-y-3">
      <section className="rounded-[1.35rem] border border-border-subtle bg-background/88 p-3 shadow-lg backdrop-blur-xl md:hidden">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <ClientAutocompleteField
              autocomplete={clientAutocomplete}
              placeholder="Buscar cliente"
              inputClassName="h-11 rounded-2xl bg-card-background"
              popoverContentClassName="z-[60]"
              appliedHint={
                <ClientFilterHint
                  clientName={clientAutocomplete.appliedClientName}
                />
              }
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsDrawerOpen(true)}
            className="h-11 shrink-0 rounded-2xl border-border-subtle bg-card-background px-4 font-bold text-text-primary"
          >
            <SlidersHorizontal className="size-4" />
            <span className="sr-only">Filtros</span>
          </Button>
        </div>
      </section>

      <section className="hidden flex-col items-stretch gap-3 rounded-[1.5rem] border border-border-subtle bg-background/85 p-2.5 shadow-lg backdrop-blur-xl md:flex md:rounded-[2rem] md:p-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SegmentedControl
              options={periodOptions}
              selectedValue={selectedPeriod}
              onSelect={(value) => setSelectedPeriod(value as PeriodId)}
              layoutId="finance-period-desktop-pill"
              className="lg:w-auto"
            />

            <SegmentedControl
              options={paymentStatusControlOptions}
              selectedValue={selectedPaymentStatus}
              onSelect={(value) =>
                setSelectedPaymentStatus(value as FinancePaymentStatusFilter)
              }
              layoutId="finance-status-desktop-pill"
              className="lg:w-auto"
            />
          </div>

          <div className="w-full xl:max-w-[296px]">
            <ClientAutocompleteField
              autocomplete={clientAutocomplete}
              placeholder="Busque cliente para ver resumo"
              appliedHint={
                <ClientFilterHint
                  clientName={clientAutocomplete.appliedClientName}
                />
              }
            />
          </div>
        </div>

        <AnimatePresence initial={false}>
          {selectedPeriod === 'custom' && (
            <motion.div
              initial={
                shouldReduceMotion
                  ? { opacity: 1, height: 'auto' }
                  : { opacity: 0, height: 0, y: -6 }
              }
              animate={
                shouldReduceMotion
                  ? { opacity: 1, height: 'auto', y: 0 }
                  : { opacity: 1, height: 'auto', y: 0 }
              }
              exit={
                shouldReduceMotion
                  ? { opacity: 0, height: 0 }
                  : { opacity: 0, height: 0, y: -6 }
              }
              transition={shouldReduceMotion ? { duration: 0 } : financeMotion.feedback}
              className="overflow-hidden"
            >
              <div className="grid w-full gap-3 border-t border-border-subtle pt-3 sm:grid-cols-2 md:flex md:justify-end">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="h-11 w-full rounded-xl border-border-subtle bg-card-background font-bold text-text-primary shadow-sm md:h-12 md:w-40"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="h-11 w-full rounded-xl border-border-subtle bg-card-background font-bold text-text-primary shadow-sm md:h-12 md:w-40"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="rounded-t-[2rem] border-border-subtle bg-background md:hidden">
          <DrawerHeader className="px-4 pt-5 text-left">
            <DrawerTitle className="text-lg font-display font-extrabold text-text-primary">
              Ajustar filtros
            </DrawerTitle>
            <DrawerDescription>
              Escolha o periodo, o status e o cliente do recorte financeiro.
            </DrawerDescription>
          </DrawerHeader>

          <div className="space-y-5 overflow-y-auto px-4 pb-2">
            <section className="space-y-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">
                  Periodo
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Defina a janela principal do resumo.
                </p>
              </div>
              <SegmentedControl
                options={periodOptions}
                selectedValue={selectedPeriod}
                onSelect={(value) => setSelectedPeriod(value as PeriodId)}
                layoutId="finance-period-mobile-pill"
              />

              <AnimatePresence initial={false}>
                {selectedPeriod === 'custom' && (
                  <motion.div
                    initial={
                      shouldReduceMotion
                        ? { opacity: 1, height: 'auto' }
                        : { opacity: 0, height: 0, y: -6 }
                    }
                    animate={
                      shouldReduceMotion
                        ? { opacity: 1, height: 'auto', y: 0 }
                        : { opacity: 1, height: 'auto', y: 0 }
                    }
                    exit={
                      shouldReduceMotion
                        ? { opacity: 0, height: 0 }
                        : { opacity: 0, height: 0, y: -6 }
                    }
                    transition={shouldReduceMotion ? { duration: 0 } : financeMotion.feedback}
                    className="overflow-hidden"
                  >
                    <div className="grid gap-3 pt-1 sm:grid-cols-2">
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                        className="h-11 rounded-xl border-border-subtle bg-card-background font-bold text-text-primary"
                      />
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                        className="h-11 rounded-xl border-border-subtle bg-card-background font-bold text-text-primary"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            <section className="space-y-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">
                  Status
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Refine o recorte por pagamento.
                </p>
              </div>
              <SegmentedControl
                options={paymentStatusControlOptions}
                selectedValue={selectedPaymentStatus}
                onSelect={(value) =>
                  setSelectedPaymentStatus(value as FinancePaymentStatusFilter)
                }
                layoutId="finance-status-mobile-pill"
              />
            </section>

          </div>

          <DrawerFooter className="px-4 pb-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDrawerOpen(false)}
              className="h-11 rounded-2xl border-border-subtle bg-card-background font-bold text-text-primary"
            >
              Fechar
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
