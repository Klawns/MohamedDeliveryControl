import type { PeriodId } from '../_types';

const PERIOD_ACCENTS: Record<
  PeriodId,
  {
    badge: string;
    border: string;
    surface: string;
    glow: string;
    text: string;
    heroBorder: string;
    heroChip: string;
    heroGlow: string;
    heroLine: string;
  }
> = {
  today: {
    badge: 'bg-primary text-white',
    border: 'border-primary/20',
    surface: 'bg-primary/10',
    glow: 'from-primary/16 via-primary/6 to-transparent',
    text: 'text-primary',
    heroBorder: 'border-primary/18',
    heroChip: 'border-primary/12 bg-primary/8 text-primary',
    heroGlow: 'bg-primary/10',
    heroLine: 'via-primary/55',
  },
  week: {
    badge: 'bg-emerald-500 text-white',
    border: 'border-emerald-500/20',
    surface: 'bg-emerald-500/10',
    glow: 'from-emerald-500/16 via-emerald-500/6 to-transparent',
    text: 'text-emerald-400',
    heroBorder: 'border-emerald-400/18',
    heroChip: 'border-emerald-400/14 bg-emerald-400/8 text-emerald-700',
    heroGlow: 'bg-emerald-300/10',
    heroLine: 'via-emerald-400/55',
  },
  month: {
    badge: 'bg-violet-500 text-white',
    border: 'border-violet-500/20',
    surface: 'bg-violet-500/10',
    glow: 'from-violet-500/16 via-violet-500/6 to-transparent',
    text: 'text-violet-400',
    heroBorder: 'border-violet-400/18',
    heroChip: 'border-violet-400/14 bg-violet-400/8 text-violet-700',
    heroGlow: 'bg-violet-300/10',
    heroLine: 'via-violet-400/55',
  },
  year: {
    badge: 'bg-amber-500 text-slate-950',
    border: 'border-amber-500/20',
    surface: 'bg-amber-500/10',
    glow: 'from-amber-500/16 via-amber-500/6 to-transparent',
    text: 'text-amber-400',
    heroBorder: 'border-amber-400/18',
    heroChip: 'border-amber-400/18 bg-amber-400/10 text-amber-700',
    heroGlow: 'bg-amber-300/10',
    heroLine: 'via-amber-400/55',
  },
  custom: {
    badge: 'bg-sky-500 text-white',
    border: 'border-sky-500/20',
    surface: 'bg-sky-500/10',
    glow: 'from-sky-500/16 via-sky-500/6 to-transparent',
    text: 'text-sky-400',
    heroBorder: 'border-sky-400/18',
    heroChip: 'border-sky-400/14 bg-sky-400/8 text-sky-700',
    heroGlow: 'bg-sky-300/10',
    heroLine: 'via-sky-400/55',
  },
};

export function getPeriodAccent(periodId: PeriodId) {
  return PERIOD_ACCENTS[periodId];
}
