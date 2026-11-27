import { createContext, Dispatch, ReactNode, useContext, useReducer } from "react";
import { GeocodeResult } from "utils/hooks";
import SearchFilters from "utils/searchFilters";

import { initialState, MapSearchAction, mapSearchReducer } from "./mapSearchReducers";

const MapSearchContext = createContext(initialState);
const MapSearchDispatchContext = createContext<Dispatch<MapSearchAction>>(() => {
  throw new Error("MapSearchDispatchContext used outside of provider");
});

function useMapSearchState() {
  return useContext(MapSearchContext);
}

function useMapSearchDispatch() {
  return useContext(MapSearchDispatchContext);
}

// This is the pattern of using Reducer with Context we're using here:
// https://react.dev/learn/scaling-up-with-reducer-and-context
// @TODO(NA): Keep the search state (place, area, filters, page) in sync with the URL, so searches can be shared,
// survive a refresh and work with the back button. pages/search.tsx already reads some of it on load.

function MapSearchProvider({
  children,
  initialBbox,
  initialLocationName,
  initialFilters,
}: {
  children: ReactNode;
  initialBbox: GeocodeResult["bbox"] | undefined;
  initialLocationName: string | undefined;
  initialFilters: SearchFilters;
}) {
  const [mapSearchState, dispatch] = useReducer(mapSearchReducer, {
    ...initialState,
    hasActiveFilters: Object.keys(initialFilters).length > 0 ? true : false,
    // getHasActiveFilters diffs against initialState, so missing keys would read as active
    filters: { ...initialState.filters, ...initialFilters },
    search: {
      query: initialLocationName,
      bbox: initialBbox,
    },
    // a link to a place's area, e.g. /search?location=Berlin&bbox=…, names that place in the results line
    uiOnly: { ...initialState.uiOnly, placeName: initialBbox ? initialLocationName : undefined },
  });

  return (
    <MapSearchContext.Provider value={mapSearchState}>
      <MapSearchDispatchContext.Provider value={dispatch}>{children}</MapSearchDispatchContext.Provider>
    </MapSearchContext.Provider>
  );
}

export { MapSearchProvider, useMapSearchDispatch, useMapSearchState };
