import { HostingStatus, SleepingArrangement } from "proto/api_pb";
import { useState } from "react";

import { FilterOptions } from "../SearchPage";
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
  completeProfile: boolean;
  lastActive: number;
  hasReferences: boolean;
  hasStrongVerification: boolean;
  hostingStatus: HostingStatus;
  meetupStatus: Exclude<
    HostingStatus,
    | HostingStatus.HOSTING_STATUS_UNKNOWN
    | HostingStatus.HOSTING_STATUS_UNSPECIFIED
  >[];
  numGuests: number | undefined;
  sleepingArrangement: SleepingArrangement;
}

export function useSearchFilters() {
  const [filters, setFilters] = useState(initialState.filters);

  // Update a single filter
  const updateFilter = (newFilters: Partial<FilterOptions>) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      ...newFilters,
    }));
  };

  const resetFilters = () => {
    setFilters(initialState.filters);
  };

  return {
    filters,
    resetFilters,
    updateFilter,
  };
}

export type { LocalSearchFilters };
