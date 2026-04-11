import { resolveRideDateValue } from '@/lib/date-utils';
import type { PaymentStatus, RideViewModel } from '@/types/rides';

const FALLBACK_DATE = 'Data indisponivel';

export interface ClientRideCardItem {
  id: string;
  ride: RideViewModel;
  title: string;
  subtitle: string;
  location: string | null;
  totalValue: number;
  paidWithBalance?: number;
  debtValue?: number;
  paymentStatus: PaymentStatus;
}

function formatRideDate(date: Date | null) {
  if (!date) {
    return {
      formattedDate: FALLBACK_DATE,
      formattedTime: null,
    };
  }

  return {
    formattedDate: date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    formattedTime: date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

function formatRideShortId(id: string) {
  return id.split('-')[0] || id;
}

function formatRideSubtitle(formattedTime: string | null, shortId: string) {
  return `${formattedTime ? `${formattedTime} - ` : ''}ID ${shortId}`;
}

export function getClientRidesCountLabel(count: number) {
  return count === 1 ? '1 corrida carregada' : `${count} corridas carregadas`;
}

export function toClientRideCardItem(ride: RideViewModel): ClientRideCardItem {
  const rideDate = resolveRideDateValue(ride.rideDate, ride.createdAt);
  const { formattedDate, formattedTime } = formatRideDate(rideDate);
  const shortId = formatRideShortId(ride.id);

  return {
    id: ride.id,
    ride,
    title: formattedDate,
    subtitle: formatRideSubtitle(formattedTime, shortId),
    location: ride.location?.trim() || null,
    totalValue: ride.value,
    paidWithBalance: ride.paidWithBalance,
    debtValue: ride.debtValue,
    paymentStatus: ride.paymentStatus,
  };
}

export function toClientRideCardItems(rides: RideViewModel[]) {
  return rides.map(toClientRideCardItem);
}
