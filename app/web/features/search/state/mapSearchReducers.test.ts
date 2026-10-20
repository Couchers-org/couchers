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
