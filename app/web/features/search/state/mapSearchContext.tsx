import { createContext, Dispatch, ReactNode, useContext, useReducer } from "react";
import { UserSearchFilterOptions } from "service/search";
import { GeocodeResult } from "utils/hooks";

import { getHasActiveFilters } from "../utils/mapUtils";
import { initialState, MapSearchAction, mapSearchReducer, MapSearchState } from "./mapSearchReducers";

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
// @TODO(NA): Future refactoring could help reduce the need for this pattern,
// e.g. if the APIs were refactored to return not just the users but the current filters and search state,
// we could just grab it from the react-query cache since we are passing that data to the API anyway.

function MapSearchProvider({
  children,
  initialBbox,
  initialLocationName,
  initialFilters,
}: {
  children: ReactNode;
  initialBbox: GeocodeResult["bbox"] | undefined;
  initialLocationName: string | undefined;
  initialFilters: UserSearchFilterOptions;
}) {
  const seededState: MapSearchState = {
    ...initialState,
    filters: { ...initialState.filters, ...initialFilters },
    search: {
      query: initialLocationName,
      bbox: initialBbox,
    },
  };
  const [mapSearchState, dispatch] = useReducer(mapSearchReducer, {
    ...seededState,
    hasActiveFilters: getHasActiveFilters(seededState, initialState),
  });

  return (
    <MapSearchContext.Provider value={mapSearchState}>
      <MapSearchDispatchContext.Provider value={dispatch}>{children}</MapSearchDispatchContext.Provider>
    </MapSearchContext.Provider>
  );
}

export { MapSearchProvider, useMapSearchDispatch, useMapSearchState };
