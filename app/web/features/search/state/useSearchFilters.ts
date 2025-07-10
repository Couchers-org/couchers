import { HostingStatus, SleepingArrangement } from "proto/api_pb";
import { useEffect, useState } from "react";

import { FilterOptions } from "../SearchPage";
import { useMapSearchState } from "./mapSearchContext";
import { initialState } from "./mapSearchReducers";

/** Local State for Search FilterDialog
 * This is so values can be changed in the dialog before being applied to the reducer state
 * On Apply click, all values are applied to the reducer state at once
 */

interface LocalSearchFilters {
  acceptsKids: boolean;
  acceptsPets: boolean;
  acceptsLastMinRequests: boolean;
  ageMin: number;
  ageMax: number;
  drinkingAllowed: boolean;
  showEmptyProfile: boolean;
  lastActive: number;
  hasReferences: boolean;
  hasStrongVerification: boolean;
  hostingStatus: HostingStatus[];
  meetupStatus: Exclude<
    HostingStatus,
    | HostingStatus.HOSTING_STATUS_UNKNOWN
    | HostingStatus.HOSTING_STATUS_UNSPECIFIED
  >[];
  numGuests: number | undefined;
  sleepingArrangement: SleepingArrangement;
}

// Map from internal state (hostingStatusOptions) to FilterOptions (hostingStatus)
const mapStateToFilterOptions = (stateFilters: any): FilterOptions => ({
  ...stateFilters,
  hostingStatus: stateFilters.hostingStatusOptions,
});

export function useSearchFilters() {
  const { filters: stateFilters } = useMapSearchState();

  const [filters, setFilters] = useState<FilterOptions>(mapStateToFilterOptions(initialState.filters));

  // Sync local filters with global filters when dialog is opened
  useEffect(() => {
    setFilters(mapStateToFilterOptions(stateFilters));
  }, [stateFilters]);

  // Update a single filter
  const updateFilter = (newFilters: Partial<FilterOptions>) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      ...newFilters,
    }));
  };

  const resetFilters = () => {
    setFilters(mapStateToFilterOptions(initialState.filters));
  };

  return {
    filters,
    resetFilters,
    updateFilter,
  };
}

export type { LocalSearchFilters };
