import { renderHook, waitFor } from "@testing-library/react";
import { service } from "service";
import wrapper from "test/hookWrapper";

import { initialState, MapSearchState } from "../state/mapSearchReducers";
import { useUserSearch } from "./useUserSearch";

const userSearchV2Mock = service.search.userSearchV2 as jest.Mock;

const emptyResponse = {
  resultsList: [],
  nextPageToken: "",
  totalItems: 0,
};

function stateWith(overrides: Partial<MapSearchState>): MapSearchState {
  return { ...initialState, ...overrides };
}

function paramsFor(state: MapSearchState) {
  return {
    ...state.filters,
    ...state.search,
    // mirrors SearchPage: don't send query when bbox is present
    query: state.search.bbox ? undefined : state.search.query,
    selectedUserId: state.shouldSearchByUserId ? state.selectedUserId : undefined,
  };
}

beforeEach(() => {
  userSearchV2Mock.mockResolvedValue(emptyResponse);
});

describe("useUserSearch", () => {
  it("doesn't hit the api when there is no query, bbox, filter or selected user", async () => {
    const state = stateWith({});

    const { result } = renderHook(() => useUserSearch(paramsFor(state), state), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(userSearchV2Mock).not.toHaveBeenCalled();
    expect(result.current.users).toBeUndefined();
    expect(result.current.totalItems).toBe(0);
  });

  it.each([
    ["a bbox", { search: { bbox: [0, 0, 1, 1] as [number, number, number, number], query: undefined } }],
    ["a query", { search: { bbox: undefined, query: "berlin" } }],
    ["active filters", { hasActiveFilters: true }],
    ["a selected user", { selectedUserId: 1, shouldSearchByUserId: true }],
  ])("hits the api when there is %s", async (_label, overrides) => {
    const state = stateWith(overrides as Partial<MapSearchState>);

    renderHook(() => useUserSearch(paramsFor(state), state), { wrapper });

    await waitFor(() => expect(userSearchV2Mock).toHaveBeenCalledTimes(1));
  });

  it("stops hitting the api once the search criteria are cleared", async () => {
    const searchingState = stateWith({
      search: { bbox: [0, 0, 1, 1], query: undefined },
    });

    const { rerender } = renderHook(({ state }: { state: MapSearchState }) => useUserSearch(paramsFor(state), state), {
      initialProps: { state: searchingState },
      wrapper,
    });

    await waitFor(() => expect(userSearchV2Mock).toHaveBeenCalledTimes(1));

    rerender({ state: stateWith({}) });

    await waitFor(() => expect(userSearchV2Mock).toHaveBeenCalledTimes(1));
  });
});
