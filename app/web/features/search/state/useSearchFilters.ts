import { HostingStatus, SleepingArrangement } from "proto/api_pb";
import { useState } from "react";

import { FilterOptions } from "../SearchPage";
import { HostingStatusOptions } from "../utils/constants";
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
  // Map UserSearchFilters to FilterOptions format
  const mapToFilterOptions = (userFilters: typeof initialState.filters): FilterOptions => ({
    acceptsKids: userFilters.acceptsKids,
    acceptsPets: userFilters.acceptsPets,
    acceptsLastMinRequests: userFilters.acceptsLastMinRequests,
    ageMin: userFilters.ageMin,
    ageMax: userFilters.ageMax,
    completeProfile: userFilters.completeProfile,
    drinkingAllowed: userFilters.drinkingAllowed,
    hasReferences: userFilters.hasReferences,
    hasStrongVerification: userFilters.hasStrongVerification,
    hostingStatus: userFilters.hostingStatusOptions as HostingStatusOptions[], // Map hostingStatusOptions to hostingStatus
    meetupStatus: userFilters.meetupStatus,
    numGuests: userFilters.numGuests,
    lastActive: userFilters.lastActive,
    sleepingArrangement: userFilters.sleepingArrangement,
    smokesAtHome: userFilters.smokesAtHome,
  });

  const [filters, setFilters] = useState(mapToFilterOptions(initialState.filters));

  // Update a single filter
  const updateFilter = (newFilters: Partial<FilterOptions>) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      ...newFilters,
    }));
  };

  const resetFilters = () => {
    setFilters(mapToFilterOptions(initialState.filters));
  };

  return {
    filters,
    resetFilters,
    updateFilter,
  };
}

export type { LocalSearchFilters };
