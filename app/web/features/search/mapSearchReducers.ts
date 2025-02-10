import { GeocodeResult } from "utils/hooks";
import { FilterKey, FilterValue } from "./SearchPage";
import { UserSearchFilters } from "service/search";
import { Reducer } from "react";

enum mapSearchActionTypes {
  SET_FILTER = "SET_FILTER",
  RESET_FILTERS = "RESET_FILTERS",
}

type MapSearchAction =
  | {
      type: mapSearchActionTypes.SET_FILTER;
      payload: { key: FilterKey; value: FilterValue };
    }
  | { type: mapSearchActionTypes.RESET_FILTERS };

const initialState: UserSearchFilters = {
  query: "",
  bbox: undefined,
  lastActive: 0,
  hostingStatusOptions: [],
  numGuests: undefined,
  completeProfile: false,
};

const mapSearchReducer = (
  state: UserSearchFilters,
  action: MapSearchAction,
): UserSearchFilters => {
  switch (action.type) {
    case mapSearchActionTypes.SET_FILTER:
      if (action.payload.key === "location") {
        return {
          ...state,
          bbox: (action.payload.value as GeocodeResult).bbox,
        };
      }

      if (action.payload.key === "query") {
        return { ...state, query: action.payload.value as string };
      }

      return { ...state, [action.payload.key]: action.payload.value };
    case mapSearchActionTypes.RESET_FILTERS:
      return initialState;
    default:
      return state;
  }
};

export { mapSearchActionTypes, initialState, mapSearchReducer };
export type { MapSearchAction };
