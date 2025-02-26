import { User } from "proto/api_pb";
import { UserSearchFilters } from "service/search";
import { GeocodeResult } from "utils/hooks";

import { FilterOptions, SearchOptions } from "./SearchPage";
import {
  Coordinates,
  DEFAULT_AGE_MAX,
  DEFAULT_AGE_MIN,
} from "./utils/constants";
import { getHasActiveFilters } from "./utils/mapUtils";

enum mapSearchActionTypes {
  SET_SEARCH = "SET_SEARCH",
  CLEAR_SEARCH_INPUT_VALUE = "CLEAR_SEARCH_INPUT_VALUE",
  SET_FILTERS = "SET_FILTERS",
  RESET_FILTERS = "RESET_FILTERS",
  SET_SELECTED_USER_IDS = "SET_SELECTED_USER_IDS",
}

type MapSearchState = {
  filters: UserSearchFilters;
  hasActiveFilters: boolean;
  hasSearchBounds: boolean;
  hasSearchInputValue: boolean;
  search: {
    bbox?: Coordinates;
    query?: string;
  };
  selectedUserIds: User.AsObject["userId"][];
};

type MapSearchAction =
  | {
      type: mapSearchActionTypes.SET_SEARCH;
      payload: SearchOptions;
    }
  | {
      type: mapSearchActionTypes.CLEAR_SEARCH_INPUT_VALUE;
      payload?: { bbox?: SearchOptions["bbox"] };
    }
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
  hasSearchBounds: false,
  hasSearchInputValue: false,
  search: {
    bbox: undefined,
    query: "",
  },
  selectedUserIds: [],
};

const mapSearchReducer = (
  state: MapSearchState,
  action: MapSearchAction,
): MapSearchState => {
  switch (action.type) {
    case mapSearchActionTypes.CLEAR_SEARCH_INPUT_VALUE:
      return {
        ...state,
        search: {
          ...state.search,
          query: "",
          ...(action.payload?.bbox ? { bbox: action.payload.bbox } : {}),
        },
        hasSearchInputValue: false,
        hasSearchBounds: action.payload?.bbox !== undefined,
      };
    case mapSearchActionTypes.SET_SEARCH:
      const updatedSearchQuery = { ...state.search };

      if (action.payload.bbox) {
        updatedSearchQuery.bbox = action.payload.bbox;
      }
      // We get a location when user searches search input
      if (action.payload.location) {
        const bbox = (action.payload.location as GeocodeResult).bbox;
        const formattedBbox = [
          bbox[2],
          bbox[3],
          bbox[0],
          bbox[1],
        ] as Coordinates;

        updatedSearchQuery.bbox = formattedBbox; // sw long, sw lat, ne long, ne lat
        updatedSearchQuery.query = action.payload.location?.name;
      }

      if (action.payload.keyword) {
        updatedSearchQuery.query = action.payload.keyword;
        updatedSearchQuery.bbox = initialState.search.bbox;
      }

      return {
        ...state,
        search: updatedSearchQuery,
        hasSearchInputValue:
          action.payload.location !== undefined ||
          (action.payload.keyword?.length ?? 0) > 0,
        hasSearchBounds:
          action.payload.bbox !== undefined ||
          action.payload.location !== undefined,
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
      return {
        ...state,
        filters: initialState.filters,
        hasActiveFilters: false,
      };

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

export { initialState, mapSearchActionTypes, mapSearchReducer };
export type { MapSearchAction, MapSearchState };
