import { Coordinates, MapSearchTypes } from "features/search/utils/constants";
import { useMemo, useReducer, useRef, useState } from "react";
import { MapRef } from "react-map-gl/maplibre";

import { initialState, mapSearchReducer } from "../state/mapSearchReducers";
import { meetsApiSearchCriteria } from "../utils/mapUtils";

export function useSearchState(
  locationName: string | undefined,
  bbox: Coordinates | undefined,
) {
  const mapRef = useRef<MapRef | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchType, setSearchType] = useState<MapSearchTypes>("location");
  const [zoom, setZoom] = useState(1);

  const [mapSearchState, dispatch] = useReducer(mapSearchReducer, {
    ...initialState,
    search: { query: locationName, bbox },
    hasSearchInputValue: Boolean(locationName),
    hasSearchBounds: Boolean(bbox),
  });

  // useMemo to avoid unnecessary object reference changes - causing unnecessary rerenders
  const searchParams = useMemo(
    () => ({ ...mapSearchState.filters, ...mapSearchState.search }),
    [mapSearchState.filters, mapSearchState.search],
  );

  const meetsSearchCriteria = meetsApiSearchCriteria({
    hasActiveFilters: mapSearchState.hasActiveFilters,
    hasSearchInputValue: mapSearchState.hasSearchInputValue,
    zoom,
  });

  return {
    mapRef,
    isFiltersOpen,
    setIsFiltersOpen,
    searchType,
    setSearchType,
    zoom,
    setZoom,
    mapSearchState,
    dispatch,
    searchParams,
    meetsSearchCriteria,
  };
}
