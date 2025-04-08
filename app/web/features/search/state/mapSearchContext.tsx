import {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useReducer,
} from "react";
import { GeocodeResult } from "utils/hooks";

import {
  initialState,
  MapSearchAction,
  mapSearchReducer,
} from "./mapSearchReducers";

const MapSearchContext = createContext(initialState);
const MapSearchDispatchContext = createContext<Dispatch<MapSearchAction>>(
  () => {
    throw new Error("MapSearchDispatchContext used outside of provider");
  },
);

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
}: {
  children: ReactNode;
  initialBbox: GeocodeResult["bbox"] | undefined;
  initialLocationName: string | undefined;
}) {
  const [mapSearchState, dispatch] = useReducer(mapSearchReducer, {
    ...initialState,
    search: { query: initialLocationName, bbox: initialBbox },
  });

  return (
    <MapSearchContext.Provider value={mapSearchState}>
      <MapSearchDispatchContext.Provider value={dispatch}>
        {children}
      </MapSearchDispatchContext.Provider>
    </MapSearchContext.Provider>
  );
}

export {
  MapSearchContext,
  MapSearchDispatchContext,
  MapSearchProvider,
  useMapSearchDispatch,
  useMapSearchState,
};
