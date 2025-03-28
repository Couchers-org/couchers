import { User } from "proto/api_pb";
import { UserSearchFilters } from "service/search";
import { GeocodeResult } from "utils/hooks";

import { FilterOptions, SearchOptions } from "../SearchPage";
import {
  Coordinates,
  DEFAULT_AGE_MAX,
  DEFAULT_AGE_MIN,
  MAX_MAP_ZOOM_LEVEL_FOR_SEARCH,
} from "../utils/constants";
import { getHasActiveFilters } from "../utils/mapUtils";

/** WHY USE A REDUCER FOR OUR MAP STATE?
 * Mostly we use react-query for state management, which stores api responses as is in the browser cache.
 * This generally works for us, as we use the api response as returned (more or less) in the UI.
 * For the map, we need to modify the api response format significantly before using it in the UI.
 * In some cases, we want to change the UI without calling the api again.
 * Decoupling UI-state from api query response using a reducer allows us to store UI-specific state
 * in a single place, and update it in a predictable way.
 * In this case we want to decouple the users response from the search criteria and filters.
 *
 * READ MORE: https://react.dev/reference/react/useReducer
 */

// The action types for the map search reducer
enum mapSearchActionTypes {
  SET_SEARCH = "SET_SEARCH",
  CLEAR_SEARCH_INPUT_VALUE = "CLEAR_SEARCH_INPUT_VALUE",
  SET_FILTERS = "SET_FILTERS",
  RESET_FILTERS = "RESET_FILTERS",
  SET_MOVE_MAP = "SET_MOVE_MAP",
  SET_PAGE_NUMBER = "SET_PAGE_NUMBER",
  SET_SELECTED_USER_ID = "SET_SELECTED_USER_ID",
  SET_ZOOM = "SET_ZOOM",
}

// Overall format of the map search state
type MapSearchState = {
  filters: UserSearchFilters;
  hasActiveFilters: boolean;
  hasSearchInputValue: boolean;
  pageNumber: number;
  search: {
    bbox?: Coordinates;
    query?: string;
  };
  selectedUserId: User.AsObject["userId"] | undefined;
  showSearchThisAreaButton: boolean;
  zoom: number;
};

// The action types for the map search reducer
type MapSearchAction =
  | {
      type: mapSearchActionTypes.SET_SEARCH;
      payload: SearchOptions;
    }
  | {
      type: mapSearchActionTypes.CLEAR_SEARCH_INPUT_VALUE;
    }
  | {
      type: mapSearchActionTypes.SET_MOVE_MAP;
    }
  | {
      type: mapSearchActionTypes.SET_FILTERS;
      payload: FilterOptions;
    }
  | {
      type: mapSearchActionTypes.SET_PAGE_NUMBER;
      payload: { pageNumber: number };
    }
  | { type: mapSearchActionTypes.RESET_FILTERS }
  | {
      type: mapSearchActionTypes.SET_SELECTED_USER_ID;
      payload: { userId: User.AsObject["userId"] };
    }
  | {
      type: mapSearchActionTypes.SET_ZOOM;
      payload: { zoom: number };
    };

const initialState: MapSearchState = {
  filters: {
    acceptsKids: undefined,
    acceptsLastMinRequests: undefined,
    acceptsPets: undefined,
    ageMin: undefined,
    ageMax: undefined,
    completeProfile: undefined,
    drinkingAllowed: undefined,
    lastActive: 0,
    hasReferences: undefined,
    hasStrongVerification: undefined,
    hostingStatusOptions: undefined,
    numGuests: undefined,
    sleepingArrangement: undefined,
    smokesAtHome: undefined,
  },
  hasActiveFilters: false,
  hasSearchInputValue: false,
  pageNumber: 0,
  search: {
    bbox: undefined,
    query: "",
  },
  selectedUserId: undefined,
  showSearchThisAreaButton: false,
  zoom: 1,
};

const mapSearchReducer = (
  state: MapSearchState,
  action: MapSearchAction,
): MapSearchState => {
  switch (action.type) {
    case mapSearchActionTypes.CLEAR_SEARCH_INPUT_VALUE:
      // State is read-only. Don’t modify any objects or arrays in state directly 🚩.
      // Instead, always return new objects from your reducer ✅.
      return {
        ...state,
        search: {
          bbox: initialState.search.bbox,
          query: initialState.search.query,
        },
        hasSearchInputValue: false,
        pageNumber: initialState.pageNumber,
      };
    case mapSearchActionTypes.SET_SEARCH:
      const updatedSearchQuery = { ...state.search };

      if (action.payload.bbox) {
        updatedSearchQuery.bbox = action.payload.bbox;
        updatedSearchQuery.query = initialState.search.query;
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
        updatedSearchQuery.query = initialState.search.query;
      }

      if (action.payload.keyword) {
        updatedSearchQuery.query =
          action.payload.keyword === ""
            ? initialState.search.query
            : action.payload.keyword;
        updatedSearchQuery.bbox = initialState.search.bbox;
      }

      return {
        ...state,
        search: updatedSearchQuery,
        hasSearchInputValue:
          action.payload.location ||
          (action.payload.keyword && action.payload.keyword.length > 0)
            ? true
            : false,
        pageNumber: initialState.pageNumber,
        showSearchThisAreaButton: false,
        zoom: action.payload.keyword ? 1 : state.zoom,
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

        if (key === "acceptsKids") {
          updatedFilters.acceptsKids =
            action.payload[key] === false ? undefined : action.payload[key];
        }
        if (key === "acceptsLastMinRequests") {
          updatedFilters.acceptsLastMinRequests =
            action.payload[key] === false ? undefined : action.payload[key];
        }
        if (key === "completeProfile") {
          updatedFilters.completeProfile =
            action.payload[key] === false ? undefined : true;
        }
        if (key === "drinkingAllowed") {
          updatedFilters.drinkingAllowed = action.payload[key];
        }
        if (key === "hasReferences") {
          updatedFilters.hasReferences =
            action.payload[key] === false ? undefined : action.payload[key];
        }
        if (key === "hasStrongVerification") {
          updatedFilters.hasStrongVerification =
            action.payload[key] === false ? undefined : action.payload[key];
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
        if (key === "sleepingArrangement") {
          updatedFilters.sleepingArrangement =
            action.payload[key] && action.payload[key].length === 0
              ? undefined
              : action.payload[key];
        }
        if (key === "smokesAtHome") {
          updatedFilters.smokesAtHome = action.payload[key];
        }
      }

      const newState = {
        ...state,
        filters: updatedFilters,
      };

      return {
        ...newState,
        hasActiveFilters: getHasActiveFilters(newState, initialState),
        pageNumber: initialState.pageNumber,
      };

    case mapSearchActionTypes.SET_PAGE_NUMBER:
      return {
        ...state,
        pageNumber: action.payload.pageNumber,
      };

    case mapSearchActionTypes.RESET_FILTERS:
      return {
        ...state,
        filters: initialState.filters,
        hasActiveFilters: false,
        pageNumber: initialState.pageNumber,
      };

    case mapSearchActionTypes.SET_MOVE_MAP:
      const zoom = state.zoom;

      return {
        ...state,
        showSearchThisAreaButton:
          zoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH && !state.hasSearchInputValue,
      };

    case mapSearchActionTypes.SET_SELECTED_USER_ID:
      const currentSelectedUserId = state.selectedUserId;

      return {
        ...state,
        selectedUserId:
          currentSelectedUserId === action.payload.userId
            ? undefined
            : action.payload.userId,
      };

    case mapSearchActionTypes.SET_ZOOM:
      const newZoom = action.payload.zoom;
      const hasSearchInputValue = state.hasSearchInputValue;

      return {
        ...state,
        ...(newZoom < MAX_MAP_ZOOM_LEVEL_FOR_SEARCH && {
          search: {
            ...state.search,
            bbox: initialState.search.bbox,
          },
        }),
        showSearchThisAreaButton:
          !hasSearchInputValue && newZoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH,
        zoom: newZoom,
      };

    default:
      throw Error("Unknown action: " + action);
  }
};

export { initialState, mapSearchActionTypes, mapSearchReducer };
export type { MapSearchAction, MapSearchState };
