import assert from 'node:assert/strict';
import test from 'node:test';
import type { RideViewModel } from '@/types/rides';
import {
  getClientRidesCountLabel,
  toClientRideCardItem,
  toClientRideCardItems,
} from './client-ride-card.mapper';

function createRide(overrides: Partial<RideViewModel> = {}): RideViewModel {
  return {
    id: 'ride-1234-abcd',
    value: 32,
    notes: null,
    status: 'COMPLETED',
    paymentStatus: 'PENDING',
    rideDate: '2026-04-10T09:30:00',
    createdAt: '2026-04-10T07:00:00',
    paidWithBalance: 5,
    debtValue: 10,
    location: ' Centro ',
    photo: null,
    client: {
      id: 'client-1',
      name: 'Alice',
    },
    clientId: 'client-1',
    clientName: 'Alice',
    paid: false,
    ...overrides,
  };
}

test('builds a card item with formatted display fields outside the view', () => {
  const item = toClientRideCardItem(createRide());

  assert.equal(item.id, 'ride-1234-abcd');
  assert.equal(item.title, '10 de abr. de 2026');
  assert.equal(item.subtitle, '09:30 - ID ride');
  assert.equal(item.location, 'Centro');
  assert.equal(item.totalValue, 32);
  assert.equal(item.paidWithBalance, 5);
  assert.equal(item.debtValue, 10);
  assert.equal(item.paymentStatus, 'PENDING');
});

test('falls back to createdAt and missing-date copy when rideDate is not valid', () => {
  const fallbackToCreatedAt = toClientRideCardItem(
    createRide({
      rideDate: '',
      createdAt: '2026-04-09T05:15:00',
    }),
  );

  assert.equal(fallbackToCreatedAt.title, '09 de abr. de 2026');
  assert.equal(fallbackToCreatedAt.subtitle, '05:15 - ID ride');

  const missingDate = toClientRideCardItem(
    createRide({
      rideDate: '',
      createdAt: '',
    }),
  );

  assert.equal(missingDate.title, 'Data indisponivel');
  assert.equal(missingDate.subtitle, 'ID ride');
});

test('builds summary labels and maps whole lists for the history view', () => {
  const items = toClientRideCardItems([createRide(), createRide({ id: 'ride-2' })]);

  assert.equal(items.length, 2);
  assert.equal(getClientRidesCountLabel(1), '1 corrida carregada');
  assert.equal(getClientRidesCountLabel(2), '2 corridas carregadas');
});
