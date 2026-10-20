import { LngLat } from "maplibre-gl";
import { HostingStatus } from "proto/api_pb";

import { initialState, mapSearchActionTypes, mapSearchReducer } from "./mapSearchReducers";

describe("mapSearchReducer SET_FILTERS", () => {
  it("persists acceptsPets when set to true", () => {
    const state = mapSearchReducer(initialState, {
      type: mapSearchActionTypes.SET_FILTERS,
      payload: { acceptsPets: true },
    });

    expect(state.filters.acceptsPets).toBe(true);
    expect(state.hasActiveFilters).toBe(true);
  });

  it("normalizes acceptsPets false back to undefined", () => {
    const withPets = mapSearchReducer(initialState, {
      type: mapSearchActionTypes.SET_FILTERS,
      payload: { acceptsPets: true },
    });

    const state = mapSearchReducer(withPets, {
      type: mapSearchActionTypes.SET_FILTERS,
      payload: { acceptsPets: false },
    });

    expect(state.filters.acceptsPets).toBeUndefined();
  });
});

describe("mapSearchReducer search defaults", () => {
  const searchLocation = () =>
    mapSearchReducer(initialState, {
      type: mapSearchActionTypes.SET_SEARCH_INPUT_VALUE,
      payload: {
        location: {
          name: "Berlin, Germany",
          simplifiedName: "Berlin",
          location: new LngLat(13.4, 52.5),
          bbox: [13.0, 52.3, 13.8, 52.7],
        },
        zoom: 10,
        center: undefined,
      },
    });

  it("hides can't host profiles but shows empty profiles when searching a location", () => {
    const state = searchLocation();

    expect(state.filters.hostingStatus).toEqual([
      HostingStatus.HOSTING_STATUS_CAN_HOST,
      HostingStatus.HOSTING_STATUS_MAYBE,
    ]);
    expect(state.filters.showEmptyProfile).toBeUndefined();
  });

  it("clears the default hosting status filter when the search is cleared", () => {
    const state = mapSearchReducer(searchLocation(), {
      type: mapSearchActionTypes.CLEAR_SEARCH_INPUT_VALUE,
      payload: { bbox: undefined },
    });

    expect(state.filters.hostingStatus).toBeUndefined();
    expect(state.filters.showEmptyProfile).toBeUndefined();
  });

  it("keeps empty profiles hidden after clearing the search if the user hid them", () => {
    const hidden = mapSearchReducer(searchLocation(), {
      type: mapSearchActionTypes.SET_FILTERS,
      payload: { showEmptyProfile: false },
    });

    const state = mapSearchReducer(hidden, {
      type: mapSearchActionTypes.CLEAR_SEARCH_INPUT_VALUE,
      payload: { bbox: undefined },
    });

    expect(state.filters.showEmptyProfile).toBe(false);
  });

  it("normalizes showEmptyProfile true back to undefined", () => {
    const state = mapSearchReducer(initialState, {
      type: mapSearchActionTypes.SET_FILTERS,
      payload: { showEmptyProfile: true },
    });

    expect(state.filters.showEmptyProfile).toBeUndefined();
  });
});
