import { useEffect, useState } from "react";

import { FilterOptions } from "../SearchPage";
import { useMapSearchState } from "./mapSearchContext";
import { initialState } from "./mapSearchReducers";

/** Local State for Search FilterDialog
 * This is so values can be changed in the dialog before being applied to the reducer state
 * On Apply click, all values are applied to the reducer state at once
 */

export function useSearchFilters() {
  const { filters: stateFilters } = useMapSearchState();

  const [filters, setFilters] = useState<FilterOptions>(stateFilters);

  // Sync local filters with global filters when dialog is opened
  useEffect(() => {
    setFilters(stateFilters);
  }, [stateFilters]);

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
