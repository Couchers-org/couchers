import { renderHook } from "@testing-library/react";
import { HostingStatus } from "proto/api_pb";
import { ReactNode } from "react";
import { UserSearchFilterOptions } from "service/search";

import { MapSearchProvider, useMapSearchState } from "./mapSearchContext";
import { initialState } from "./mapSearchReducers";

const renderState = (initialFilters: UserSearchFilterOptions) =>
  renderHook(() => useMapSearchState(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MapSearchProvider initialBbox={undefined} initialLocationName={undefined} initialFilters={initialFilters}>
        {children}
      </MapSearchProvider>
    ),
  }).result.current;

describe("MapSearchProvider", () => {
  it("seeds every filter key so a freshly loaded page has no active filters", () => {
    const state = renderState({});

    expect(state.filters).toEqual(initialState.filters);
    expect(state.hasActiveFilters).toBe(false);
  });

  it("marks filters passed in from the URL as active", () => {
    const state = renderState({ hostingStatus: [HostingStatus.HOSTING_STATUS_CAN_HOST] });

    expect(state.filters.hostingStatus).toEqual([HostingStatus.HOSTING_STATUS_CAN_HOST]);
    expect(state.hasActiveFilters).toBe(true);
  });
});
