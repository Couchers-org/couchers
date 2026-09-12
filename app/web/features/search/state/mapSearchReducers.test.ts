import { HostingStatus, MeetupStatus, SleepingArrangement } from "proto/api_pb";
import { UserSearchFilterOptions } from "service/search";

import { DEFAULT_AGE_MAX, DEFAULT_AGE_MIN, lastActiveOptions } from "../utils/constants";
import { FilterUpdates, initialState, mapSearchActionTypes, mapSearchReducer } from "./mapSearchReducers";

// Required<> so that a filter added to UserSearchFilterOptions has to be covered here too
const activeValues: Required<UserSearchFilterOptions> = {
  acceptsKids: true,
  acceptsLastMinRequests: true,
  acceptsPets: true,
  ageMin: 25,
  ageMax: 40,
  drinkingAllowed: false,
  hasReferences: true,
  hasStrongVerification: true,
  hostingStatus: [HostingStatus.HOSTING_STATUS_CAN_HOST],
  lastActive: lastActiveOptions.LAST_ACTIVE_LAST_MONTH,
  meetupStatus: [MeetupStatus.MEETUP_STATUS_WANTS_TO_MEETUP],
  numGuests: 2,
  sameGenderOnly: true,
  showEmptyProfile: false,
  sleepingArrangement: [SleepingArrangement.SLEEPING_ARRANGEMENT_PRIVATE],
  smokesAtHome: false,
};

// What the FilterDialog hands over when each filter is switched back off
const offValues: Required<FilterUpdates> = {
  acceptsKids: false,
  acceptsLastMinRequests: false,
  acceptsPets: false,
  ageMin: DEFAULT_AGE_MIN,
  ageMax: DEFAULT_AGE_MAX,
  drinkingAllowed: null,
  hasReferences: false,
  hasStrongVerification: false,
  hostingStatus: [],
  lastActive: lastActiveOptions.LAST_ACTIVE_ANY,
  meetupStatus: [],
  numGuests: 0,
  sameGenderOnly: false,
  showEmptyProfile: null,
  sleepingArrangement: [],
  smokesAtHome: null,
};

const filterKeys = Object.keys(activeValues) as (keyof UserSearchFilterOptions)[];

const setFilters = (state: typeof initialState, payload: FilterUpdates) =>
  mapSearchReducer(state, { type: mapSearchActionTypes.SET_FILTERS, payload });

describe("mapSearchReducer SET_FILTERS", () => {
  it.each(filterKeys)("stores %s and marks filters as active", (key) => {
    const state = setFilters(initialState, { [key]: activeValues[key] });

    expect(state.filters).toEqual({ ...initialState.filters, [key]: activeValues[key] });
    expect(state.hasActiveFilters).toBe(true);
  });

  it.each(filterKeys)("normalizes %s back to undefined when switched off", (key) => {
    const state = setFilters(setFilters(initialState, activeValues), { [key]: offValues[key] });

    expect(state.filters[key]).toBeUndefined();
  });

  it("reports no active filters once every filter is switched off", () => {
    const allActive = setFilters(initialState, activeValues);
    expect(allActive.hasActiveFilters).toBe(true);

    const state = setFilters(allActive, offValues);

    expect(state.filters).toEqual(initialState.filters);
    expect(state.hasActiveFilters).toBe(false);
  });

  it("leaves filters that aren't in the payload untouched", () => {
    const state = setFilters(setFilters(initialState, { acceptsPets: true }), { acceptsKids: true });

    expect(state.filters.acceptsPets).toBe(true);
    expect(state.filters.acceptsKids).toBe(true);
  });

  it("treats missing filter keys as unset", () => {
    const state = setFilters({ ...initialState, filters: {} }, {});

    expect(state.hasActiveFilters).toBe(false);
  });

  it("resets to the first page", () => {
    const state = setFilters({ ...initialState, pageNumber: 3 }, { acceptsPets: true });

    expect(state.pageNumber).toBe(1);
  });
});
