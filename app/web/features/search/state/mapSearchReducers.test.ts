import { MeetupStatus } from "proto/api_pb";

import { FilterOptions } from "../SearchPage";
import { lastActiveOptions } from "../utils/constants";
import { initialState, mapSearchActionTypes, mapSearchReducer, MapSearchState } from "./mapSearchReducers";

const setFilters = (state: MapSearchState, payload: FilterOptions) =>
  mapSearchReducer(state, { type: mapSearchActionTypes.SET_FILTERS, payload });

describe("mapSearchReducer SET_FILTERS", () => {
  it("persists acceptsPets when set to true", () => {
    const state = setFilters(initialState, { acceptsPets: true });

    expect(state.filters.acceptsPets).toBe(true);
    expect(state.hasActiveFilters).toBe(true);
  });

  it("normalizes acceptsPets false back to undefined", () => {
    const state = setFilters(setFilters(initialState, { acceptsPets: true }), { acceptsPets: false });

    expect(state.filters.acceptsPets).toBeUndefined();
  });

  it("marks filters as active when only meetupStatus is set", () => {
    const state = setFilters(initialState, { meetupStatus: [MeetupStatus.MEETUP_STATUS_WANTS_TO_MEETUP] });

    expect(state.filters.meetupStatus).toEqual([MeetupStatus.MEETUP_STATUS_WANTS_TO_MEETUP]);
    expect(state.hasActiveFilters).toBe(true);
  });

  it.each(["drinkingAllowed", "smokesAtHome"] as const)("clears %s when its toggle is deselected", (key) => {
    const withValue = setFilters(initialState, { [key]: true });
    expect(withValue.filters[key]).toBe(true);

    // an exclusive ToggleButtonGroup reports a deselection as null
    const state = setFilters(withValue, { [key]: null });

    expect(state.filters[key]).toBeUndefined();
    expect(state.hasActiveFilters).toBe(false);
  });

  it.each(["drinkingAllowed", "smokesAtHome"] as const)("keeps %s when explicitly set to false", (key) => {
    const state = setFilters(initialState, { [key]: false });

    expect(state.filters[key]).toBe(false);
    expect(state.hasActiveFilters).toBe(true);
  });

  it("normalizes lastActive 'any' back to undefined", () => {
    const withLastActive = setFilters(initialState, { lastActive: lastActiveOptions.LAST_ACTIVE_LAST_MONTH });
    expect(withLastActive.hasActiveFilters).toBe(true);

    const state = setFilters(withLastActive, { lastActive: lastActiveOptions.LAST_ACTIVE_ANY });

    expect(state.filters.lastActive).toBeUndefined();
    expect(state.hasActiveFilters).toBe(false);
  });

  it("does not report active filters after applying unchanged filters on a freshly loaded page", () => {
    // pages/search.tsx seeds the filters from URL params only, so keys can be missing entirely
    const state = setFilters({ ...initialState, filters: {} }, {});

    expect(state.hasActiveFilters).toBe(false);
  });
});
