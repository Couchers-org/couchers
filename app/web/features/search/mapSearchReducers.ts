import { User } from "proto/api_pb";
import { UserSearchFilters } from "service/search";
import { GeocodeResult } from "utils/hooks";

import { FilterOptions } from "./SearchPage";
import { Coordinates } from "./utils/constants";

enum mapSearchActionTypes {
  CLEAR_LOCATION = "CLEAR_LOCATION",
  SET_FILTERS = "SET_FILTERS",
  RESET_FILTERS = "RESET_FILTERS",
  SET_SELECTED_USER_IDS = "SET_SELECTED_USER_IDS",
}

type MapSearchState = {
  filters: UserSearchFilters;
  hasActiveFilters: boolean;
  selectedUserIds: User.AsObject["userId"][];
};

type MapSearchAction =
  | { type: mapSearchActionTypes.CLEAR_LOCATION }
  | {
      type: mapSearchActionTypes.SET_FILTERS;
      payload: FilterOptions;
    }
  | { type: mapSearchActionTypes.RESET_FILTERS }
  | {
      type: mapSearchActionTypes.SET_SELECTED_USER_IDS;
      payload: { userId: User.AsObject["userId"] };
    };

const initialState: MapSearchState = {
  filters: {
    acceptsKids: undefined,
    acceptsLastMinRequests: undefined,
    acceptsPets: undefined,
    completeProfile: false,
    drinkingAllowed: undefined,
    query: "",
    bbox: [0, 0, 0, 0],
    lastActive: 0,
    hasReferences: undefined,
    hasStrongVerification: undefined,
    hostingStatusOptions: [],
    numGuests: undefined,
    smokingAllowed: undefined,
  },
  hasActiveFilters: false,
  selectedUserIds: [],
};

const mapSearchReducer = (
  state: MapSearchState,
  action: MapSearchAction,
): MapSearchState => {
  switch (action.type) {
    case mapSearchActionTypes.CLEAR_LOCATION:
      // determine if there's still active filters besides bbox and query
      const hasActiveFilters =
        state.filters.hostingStatusOptions !==
          initialState.filters.hostingStatusOptions ||
        state.filters.numGuests !== initialState.filters.numGuests ||
        state.filters.completeProfile !==
          initialState.filters.completeProfile ||
        state.filters.query !== initialState.filters.query ||
        state.filters.acceptsKids !== initialState.filters.acceptsKids ||
        state.filters.acceptsLastMinRequests !==
          initialState.filters.acceptsLastMinRequests ||
        state.filters.drinkingAllowed !==
          initialState.filters.drinkingAllowed ||
        state.filters.hasReferences !== initialState.filters.hasReferences ||
        state.filters.hasStrongVerification !==
          initialState.filters.hasStrongVerification ||
        state.filters.smokingAllowed !== initialState.filters.smokingAllowed;

      return {
        ...state,
        filters: {
          ...state.filters,
          bbox: initialState.filters.bbox,
          query: initialState.filters.query,
        },
        hasActiveFilters,
      };
    case mapSearchActionTypes.SET_FILTERS:
      const updatedFilters = { ...state.filters };

      for (const key in action.payload) {
        if (key === "location") {
          const bbox = (action.payload[key] as GeocodeResult).bbox;
          const formattedBbox = [
            bbox[2],
            bbox[3],
            bbox[0],
            bbox[1],
          ] as Coordinates;

          updatedFilters.bbox = formattedBbox; // sw long, sw lat, ne long, ne lat
        } else if (key === "query" || key === "keyword") {
          updatedFilters.query = action.payload[key];
          updatedFilters.bbox = initialState.filters.bbox;
        } else if (key === "hostingStatus") {
          updatedFilters.hostingStatusOptions =
            action.payload[key] && action.payload[key].length === 0
              ? undefined
              : action.payload[key];
        } else if (key === "numGuests") {
          updatedFilters.numGuests =
            action.payload[key] === 0 ? undefined : action.payload[key];
        } else if (key === "acceptsKids") {
          updatedFilters.acceptsKids =
            action.payload[key] === false ? undefined : action.payload[key];
        } else if (key === "acceptsLastMinRequests") {
          updatedFilters.acceptsLastMinRequests =
            action.payload[key] === false ? undefined : action.payload[key];
        } else if (key === "drinkingAllowed") {
          updatedFilters.drinkingAllowed =
            action.payload[key] === false ? undefined : action.payload[key];
        } else if (key === "hasReferences") {
          updatedFilters.hasReferences =
            action.payload[key] === false ? undefined : action.payload[key];
        } else if (key === "hasStrongVerification") {
          updatedFilters.hasStrongVerification =
            action.payload[key] === false ? undefined : action.payload[key];
        } else if (key === "smokingAllowed") {
          updatedFilters.smokingAllowed =
            action.payload[key] === false ? undefined : action.payload[key];
        }
      }

      return {
        ...state,
        filters: updatedFilters,
        hasActiveFilters: true,
      };
    case mapSearchActionTypes.RESET_FILTERS:
      return initialState;

    case mapSearchActionTypes.SET_SELECTED_USER_IDS:
      const currentSelectedUserIds = state.selectedUserIds;

      if (currentSelectedUserIds.includes(action.payload.userId)) {
        const newSelectedUserIds = currentSelectedUserIds.filter(
          (userId) => userId !== action.payload.userId,
        );

        return {
          ...state,
          hasActiveFilters: newSelectedUserIds.length > 0,
          selectedUserIds: newSelectedUserIds,
        };
      }
      return {
        ...state,
        hasActiveFilters: true,
        selectedUserIds: [...currentSelectedUserIds, action.payload.userId],
      };

    default:
      return state;
  }
};

export { initialState, mapSearchActionTypes, mapSearchReducer };
export type { MapSearchAction };
