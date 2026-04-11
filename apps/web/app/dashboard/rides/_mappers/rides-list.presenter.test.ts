import assert from "node:assert/strict";
import test from "node:test";
import { type RideViewModel } from "@/types/rides";
import { buildRidesListPresenter } from "./rides-list.presenter";

function createRide(overrides: Partial<RideViewModel> = {}): RideViewModel {
  return {
    id: "ride-1",
    value: 25,
    notes: null,
    status: "COMPLETED",
    paymentStatus: "PENDING",
    rideDate: "2026-04-10T10:00:00.000Z",
    createdAt: "2026-04-10T10:00:00.000Z",
    location: "Centro",
    photo: null,
    client: {
      id: "client-1",
      name: "Alice",
    },
    clientId: "client-1",
    clientName: "Alice",
    paid: false,
    ...overrides,
  };
}

test("returns a loading state while the first page is being resolved", () => {
  const presenter = buildRidesListPresenter({
    rides: [],
    totalCount: 0,
    isLoading: true,
    isFetching: true,
    hasActiveFilters: false,
  });

  assert.equal(presenter.contentState, "loading");
});

test("builds an error state message outside the view when the query fails without items", () => {
  const presenter = buildRidesListPresenter({
    rides: [],
    totalCount: 0,
    isLoading: false,
    isFetching: false,
    error: {
      response: {
        data: {
          message: "Unauthorized",
        },
      },
    },
    hasActiveFilters: false,
  });

  assert.equal(presenter.contentState, "error");
  assert.equal(
    presenter.errorMessage,
    "Sessao expirada. Faca login novamente.",
  );
});

test("keeps empty-state copy in the presenter when filters are active", () => {
  const presenter = buildRidesListPresenter({
    rides: [],
    totalCount: 0,
    isLoading: false,
    isFetching: false,
    hasActiveFilters: true,
  });

  assert.equal(presenter.contentState, "empty");
  assert.equal(presenter.emptyStateVariant, "filtered");
  assert.equal(presenter.emptyTitle, "Nenhuma corrida encontrada");
});

test("groups rides and exposes the summarized results label for the view", () => {
  const presenter = buildRidesListPresenter({
    rides: [createRide()],
    totalCount: 3,
    isLoading: false,
    isFetching: false,
    hasActiveFilters: false,
    now: new Date("2026-04-11T12:00:00.000Z"),
  });

  assert.equal(presenter.contentState, "results");
  assert.equal(presenter.resultsLabel, "Mostrando 1 de 3 corridas");
  assert.equal(presenter.groupedRides.length, 1);
  assert.equal(presenter.groupedRides[0]?.rides.length, 1);
});
