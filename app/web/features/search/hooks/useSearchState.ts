import { Coordinates, MapSearchTypes } from "features/search/utils/constants";
import { useReducer, useRef, useState } from "react";
import { MapRef } from "react-map-gl/maplibre";

import { initialState, mapSearchReducer } from "../mapSearchReducers";

export function useSearchState(locationName: string | undefined, bbox: Coordinates | undefined) {
  const mapRef = useRef<MapRef | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchType, setSearchType] = useState<MapSearchTypes>("location");
  const [pageNumber, setPageNumber] = useState(0);
  const [zoom, setZoom] = useState(1);

  const [mapSearchState, dispatch] = useReducer(mapSearchReducer, {
    ...initialState,
    search: { query: locationName, bbox },
    hasSearchInputValue: Boolean(locationName),
    hasSearchBounds: Boolean(bbox),
  });

  return {
    mapRef,
    isFiltersOpen,
    setIsFiltersOpen,
    searchType,
    setSearchType,
    pageNumber,
    setPageNumber,
    zoom,
    setZoom,
    mapSearchState,
    dispatch,
  };
}
