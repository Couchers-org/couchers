import { User } from "proto/api_pb";
import { UserSearchFilters } from "service/search";
import { GeocodeResult } from "utils/hooks";

import { FilterOptions, SearchQueryOptions } from "./SearchPage";
import { Coordinates } from "./utils/constants";
import { getHasActiveFilters } from "./utils/mapUtils";

enum mapSearchActionTypes {
  SET_SEARCH_QUERY = "SET_SEARCH_QUERY",
  CLEAR_SEARCH_QUERY = "CLEAR_SEARCH_QUERY",
  SET_FILTERS = "SET_FILTERS",
  RESET_FILTERS = "RESET_FILTERS",
  SET_SELECTED_USER_IDS = "SET_SELECTED_USER_IDS",
}

type MapSearchState = {
  filters: UserSearchFilters;
  hasActiveFilters: boolean;
  hasSearchQuery: boolean;
  searchQuery: {
    bbox?: Coordinates;
    query?: string;
    shouldZoomTo?: boolean;
  };
  selectedUserIds: User.AsObject["userId"][];
};

type MapSearchAction =
  | {
      type: mapSearchActionTypes.SET_SEARCH_QUERY;
      payload: SearchQueryOptions;
    }
  | { type: mapSearchActionTypes.CLEAR_SEARCH_QUERY }
  | {
      type: mapSearchActionTypes.SET_FILTERS;
      payload: FilterOptions;
    }
  | { type: mapSearchActionTypes.RESET_FILTERS }
  | {
      type: mapSearchActionTypes.SET_SELECTED_USER_IDS;
      payload: { userId: User.AsObject["userId"] };
    };

const DEFAULT_AGE_MIN = 18;
const DEFAULT_AGE_MAX = 100;

const initialState: MapSearchState = {
  filters: {
    acceptsKids: undefined,
    acceptsLastMinRequests: undefined,
    acceptsPets: undefined,
    ageMin: undefined,
    ageMax: undefined,
    completeProfile: false,
    drinkingAllowed: undefined,
    lastActive: 0,
    hasReferences: undefined,
    hasStrongVerification: undefined,
    hostingStatusOptions: undefined,
    numGuests: undefined,
    smokingAllowed: undefined,
  },
  hasActiveFilters: false,
  hasSearchQuery: false,
  searchQuery: {
    bbox: [390, 82, -173, -66],
    query: "",
  },
  selectedUserIds: [],
};

const mapSearchReducer = (
  state: MapSearchState,
  action: MapSearchAction,
): MapSearchState => {
  switch (action.type) {
    case mapSearchActionTypes.CLEAR_SEARCH_QUERY:
      return {
        ...state,
        searchQuery: initialState.searchQuery,
        hasSearchQuery: false,
      };
    case mapSearchActionTypes.SET_SEARCH_QUERY:
      const updatedSearchQuery = { ...state.searchQuery };
      if (action.payload.bbox) {
        updatedSearchQuery.bbox = action.payload.bbox;
      }
      if (action.payload.location) {
        const bbox = (action.payload.location as GeocodeResult).bbox;
        const formattedBbox = [
          bbox[2],
          bbox[3],
          bbox[0],
          bbox[1],
        ] as Coordinates;

        updatedSearchQuery.bbox = formattedBbox; // sw long, sw lat, ne long, ne lat
      }
      if (action.payload.query) {
        updatedSearchQuery.query = action.payload.query;
        updatedSearchQuery.bbox = initialState.filters.bbox;
      }
      if (action.payload.keyword) {
        updatedSearchQuery.query = action.payload.keyword;
        updatedSearchQuery.bbox = initialState.filters.bbox;
      }

      return {
        ...state,
        searchQuery: updatedSearchQuery,
        hasSearchQuery: true,
      };
    case mapSearchActionTypes.SET_FILTERS:
      const updatedFilters = { ...state.filters };

      for (const key in action.payload) {
        if (key === "ageMin") {
          updatedFilters.ageMin =
            action.payload[key] === DEFAULT_AGE_MIN
              ? undefined
              : action.payload[key];
        }
        if (key === "ageMax") {
          updatedFilters.ageMax =
            action.payload[key] === DEFAULT_AGE_MAX
              ? undefined
              : action.payload[key];
        }
        if (key === "hostingStatus") {
          updatedFilters.hostingStatusOptions =
            action.payload[key] && action.payload[key].length === 0
              ? undefined
              : action.payload[key];
        }
        if (key === "numGuests") {
          updatedFilters.numGuests =
            action.payload[key] === 0 ? undefined : action.payload[key];
        }
        if (key === "acceptsKids") {
          updatedFilters.acceptsKids =
            action.payload[key] === false ? undefined : action.payload[key];
        }
        if (key === "acceptsLastMinRequests") {
          updatedFilters.acceptsLastMinRequests =
            action.payload[key] === false ? undefined : action.payload[key];
        }
        if (key === "drinkingAllowed") {
          updatedFilters.drinkingAllowed =
            action.payload[key] === false ? undefined : action.payload[key];
        }
        if (key === "hasReferences") {
          updatedFilters.hasReferences =
            action.payload[key] === false ? undefined : action.payload[key];
        }
        if (key === "hasStrongVerification") {
          updatedFilters.hasStrongVerification =
            action.payload[key] === false ? undefined : action.payload[key];
        }
        if (key === "smokingAllowed") {
          updatedFilters.smokingAllowed =
            action.payload[key] === false ? undefined : action.payload[key];
        }
      }

      const newState = {
        ...state,
        filters: updatedFilters,
      };

      return {
        ...newState,
        hasActiveFilters: getHasActiveFilters(newState, initialState),
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
          selectedUserIds: newSelectedUserIds,
        };
      }
      return {
        ...state,
        selectedUserIds: [...currentSelectedUserIds, action.payload.userId],
      };

    default:
      return state;
  }
};

export {
  DEFAULT_AGE_MAX,
  DEFAULT_AGE_MIN,
  initialState,
  mapSearchActionTypes,
  mapSearchReducer,
};
export type { MapSearchAction, MapSearchState };
