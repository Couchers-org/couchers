import { LngLat } from "maplibre-gl";
import { GeocodeResult } from "utils/hooks";

import { MIN_SEARCH_LENGTH, NO_RESULTS_ID } from "./constants";

/** Build the options list, injecting a disabled "No results" row when empty. */
export function buildLocationDisplayOptions(
  options: GeocodeResult[] | undefined,
  inputValue: string,
  isLoading: boolean,
  noResultsLabel: string,
): GeocodeResult[] {
  const hasEmptyResults = !isLoading && options?.length === 0 && inputValue.trim().length >= MIN_SEARCH_LENGTH;

  if (hasEmptyResults) {
    return [
      {
        id: NO_RESULTS_ID,
        name: noResultsLabel,
        simplifiedName: noResultsLabel,
        location: new LngLat(0, 0),
        bbox: [0, 0, 0, 0],
        isRegion: false,
      },
    ];
  }

  return options || [];
}

export function isNoResultsOption(value: GeocodeResult | string | null) {
  return typeof value === "object" && value !== null && value.id === NO_RESULTS_ID;
}
