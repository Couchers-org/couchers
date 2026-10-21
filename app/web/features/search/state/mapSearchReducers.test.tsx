import { act, renderHook } from "@testing-library/react";
import { ReactNode } from "react";
import { GeocodeResult } from "utils/hooks";

import { Coordinates } from "../utils/constants";
import { MapSearchProvider, useMapSearchDispatch, useMapSearchState } from "./mapSearchContext";
import { initialState, mapSearchActionTypes, mapSearchReducer } from "./mapSearchReducers";

const BBOX: Coordinates = [13.0, 52.3, 13.8, 52.7];

const berlin: GeocodeResult = {
  name: "Berlin, Germany",
  simplifiedName: "Berlin",
  location: { lng: 13.4, lat: 52.5 } as GeocodeResult["location"],
  bbox: BBOX,
};

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

describe("mapSearchReducer", () => {
  describe("after searching a location and then clearing it", () => {
    const searched = mapSearchReducer(initialState, {
      type: mapSearchActionTypes.SET_SEARCH_INPUT_VALUE,
      payload: { location: berlin, center: [13.4, 52.5], zoom: 10 },
    });

    const cleared = mapSearchReducer(searched, {
      type: mapSearchActionTypes.CLEAR_SEARCH_INPUT_VALUE,
      payload: { bbox: BBOX },
    });

    it("sets up a location search", () => {
      expect(searched.search.bbox).toEqual(BBOX);
      expect(searched.hasActiveFilters).toBe(true);
    });

    it("clears the searched area", () => {
      expect(cleared.search.bbox).toBeUndefined();
      expect(cleared.search.query).toBeUndefined();
    });

    it("restores the filters the location search had defaulted on", () => {
      expect(cleared.filters).toEqual(initialState.filters);
    });

    it("reports no active filters, so no search is performed", () => {
      expect(cleared.hasActiveFilters).toBe(false);
    });
  });

  describe("after searching a location, switching to a keyword and then clearing it", () => {
    const searched = mapSearchReducer(initialState, {
      type: mapSearchActionTypes.SET_SEARCH_INPUT_VALUE,
      payload: { location: berlin, center: [13.4, 52.5], zoom: 10 },
    });

    const keyword = mapSearchReducer(searched, {
      type: mapSearchActionTypes.SET_KEYWORD_INPUT_VALUE,
      payload: { keyword: "berlin" },
    });

    const cleared = mapSearchReducer(keyword, {
      type: mapSearchActionTypes.CLEAR_KEYWORD_INPUT_VALUE,
    });

    it("clears the keyword", () => {
      expect(cleared.search.query).toBeUndefined();
    });

    it("restores the filters the location search had defaulted on", () => {
      expect(cleared.filters).toEqual(initialState.filters);
    });

    it("reports no active filters, so no search is performed", () => {
      expect(cleared.hasActiveFilters).toBe(false);
    });
  });
});

// The URL query seeds sparse filters, e.g. `{}` for a plain /search visit
describe("MapSearchProvider seeded from an empty URL query", () => {
  it("reports no active filters after searching a location and clearing it", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MapSearchProvider initialBbox={undefined} initialLocationName={undefined} initialFilters={{}}>
        {children}
      </MapSearchProvider>
    );

    const { result } = renderHook(() => ({ state: useMapSearchState(), dispatch: useMapSearchDispatch() }), {
      wrapper,
    });

    expect(result.current.state.hasActiveFilters).toBe(false);

    act(() =>
      result.current.dispatch({
        type: mapSearchActionTypes.SET_SEARCH_INPUT_VALUE,
        payload: { location: berlin, center: [13.4, 52.5], zoom: 10 },
      }),
    );

    expect(result.current.state.hasActiveFilters).toBe(true);

    act(() =>
      result.current.dispatch({
        type: mapSearchActionTypes.CLEAR_SEARCH_INPUT_VALUE,
        payload: { bbox: BBOX },
      }),
    );

    expect(result.current.state.search.bbox).toBeUndefined();
    expect(result.current.state.hasActiveFilters).toBe(false);
  });
});
