import { UserSearchFilters } from "service/search";
import { GeocodeResult } from "utils/hooks";

import { FilterKey, FilterValue } from "./SearchPage";

enum mapSearchActionTypes {
  SET_FILTER = "SET_FILTER",
  RESET_FILTERS = "RESET_FILTERS",
}

type MapSearchState = UserSearchFilters & {
  hasFilters: boolean;
  selectedUserId?: number;
};

type MapSearchAction =
  | {
      type: mapSearchActionTypes.SET_FILTER;
      payload: { key: FilterKey; value: FilterValue };
    }
  | { type: mapSearchActionTypes.RESET_FILTERS };

const initialState: MapSearchState = {
  query: "",
  bbox: [390, 82, -173, -66],
  lastActive: 0,
  hostingStatusOptions: [],
  numGuests: undefined,
  completeProfile: false,
  hasFilters: false,
  selectedUserId: undefined,
};

const mapSearchReducer = (
  state: MapSearchState,
  action: MapSearchAction,
): MapSearchState => {
  switch (action.type) {
    case mapSearchActionTypes.SET_FILTER:
      if (action.payload.key === "location") {
        const bbox = (action.payload.value as GeocodeResult).bbox;
        const formattedBbox = [bbox[2], bbox[3], bbox[0], bbox[1]]; //sw long, sw lat, ne long, ne lat

        return {
          ...state,
          bbox: formattedBbox,
          hasFilters: true,
        };
      } else if (action.payload.key === "query") {
        return {
          ...state,
          query: action.payload.value as string,
          hasFilters: true,
          selectedUserId: undefined,
        };
      } else if (action.payload.key === "selectedUserId") {
        return {
          ...state,
          hasFilters: true,
          selectedUserId: action.payload.value as number,
        };
      }

      return {
        ...state,
        [action.payload.key]: action.payload.value,
        hasFilters: true,
        selectedUserId: undefined,
      };
    case mapSearchActionTypes.RESET_FILTERS:
      return initialState;
    default:
      return state;
  }
};

export { initialState, mapSearchActionTypes, mapSearchReducer };
export type { MapSearchAction };
