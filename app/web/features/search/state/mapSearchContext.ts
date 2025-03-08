import { createContext, Dispatch, useContext } from "react";

import { initialState, MapSearchAction } from "./mapSearchReducers";

const MapSearchContext = createContext(initialState);
const MapSearchDispatchContext = createContext<
  Dispatch<MapSearchAction> | undefined
>(undefined);

function useMapSearchState() {
  return useContext(MapSearchContext);
}

function useMapSearchDispatch() {
  return useContext(MapSearchDispatchContext);
}

export {
  MapSearchContext,
  MapSearchDispatchContext,
  useMapSearchDispatch,
  useMapSearchState,
};
