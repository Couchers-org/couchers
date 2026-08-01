import { HostingStatus, User } from "couchers/proto/api_pb";
import { LngLatLike } from "maplibre-gl";
import { UserSearchFilters } from "service/search";
import { GeocodeResult } from "utils/hooks";

import { FilterOptions } from "../SearchPage";
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
  SET_INITIAL_STATE = "SET_INITIAL_STATE",
  SET_MAP_QUERY_AREA = "SET_MAP_QUERY_AREA",
  CLEAR_KEYWORD_INPUT_VALUE = "CLEAR_KEYWORD_INPUT_VALUE",
  SET_KEYWORD_INPUT_VALUE = "SET_KEYWORD_INPUT_VALUE",
  SET_SEARCH_INPUT_VALUE = "SET_SEARCH_INPUT_VALUE",
  CLEAR_SEARCH_INPUT_VALUE = "CLEAR_SEARCH_INPUT_VALUE",
  SET_FILTERS = "SET_FILTERS",
  RESET_FILTERS = "RESET_FILTERS",
  SET_MOVE_MAP_UI_ONLY = "SET_MOVE_MAP_UI_ONLY",
  SET_PAGE_NUMBER = "SET_PAGE_NUMBER",
  SET_SELECTED_USER_ID = "SET_SELECTED_USER_ID",
  SET_SHOW_SEARCH_THIS_AREA_BUTTON = "SET_SHOW_SEARCH_THIS_AREA_BUTTON",
}

// Overall format of the map search state
type MapSearchState = {
  filters: UserSearchFilters;
  hasActiveFilters: boolean;
  pageNumber: number;
  search: {
    bbox: Coordinates | undefined;
    query: string | undefined;
  };
  selectedUserId: User.AsObject["userId"] | undefined;
  shouldSearchByUserId: boolean;
  showSearchThisAreaButton: boolean;
  uiOnly: {
    bbox: Coordinates | undefined;
    center: LngLatLike | undefined;
    zoom: number;
  };
};

// The action types for the map search reducer
type MapSearchAction =
  | {
      type: mapSearchActionTypes.CLEAR_KEYWORD_INPUT_VALUE;
    }
  | {
      type: mapSearchActionTypes.SET_KEYWORD_INPUT_VALUE;
      payload: {
        keyword: string;
      };
    }
  | {
      type: mapSearchActionTypes.SET_SEARCH_INPUT_VALUE;
      payload: {
        location: GeocodeResult | undefined;
        zoom: MapSearchState["uiOnly"]["zoom"] | undefined;
        center: MapSearchState["uiOnly"]["center"] | undefined;
      };
    }
  | {
      type: mapSearchActionTypes.SET_MAP_QUERY_AREA;
      payload: {
        bbox: MapSearchState["search"]["bbox"];
        zoom?: MapSearchState["uiOnly"]["zoom"] | undefined;
        didCrossSearchThreshold?: boolean;
      };
    }
  | {
      type: mapSearchActionTypes.CLEAR_SEARCH_INPUT_VALUE;
      payload: { bbox: MapSearchState["search"]["bbox"] };
    }
  | {
      type: mapSearchActionTypes.SET_MOVE_MAP_UI_ONLY;
      payload: {
        bbox?: MapSearchState["uiOnly"]["bbox"];
        center?: MapSearchState["uiOnly"]["center"];
        zoom?: MapSearchState["uiOnly"]["zoom"];
      };
    }
  | {
      type: mapSearchActionTypes.SET_FILTERS;
      payload: FilterOptions;
    }
  | {
      type: mapSearchActionTypes.SET_PAGE_NUMBER;
      payload: { pageNumber: MapSearchState["pageNumber"] };
    }
  | { type: mapSearchActionTypes.RESET_FILTERS }
  | {
      type: mapSearchActionTypes.SET_SELECTED_USER_ID;
      payload: {
        userId: User.AsObject["userId"] | undefined;
      };
    }
  | {
      type: mapSearchActionTypes.SET_SHOW_SEARCH_THIS_AREA_BUTTON;
      payload: {
        showSearchThisAreaButton: MapSearchState["showSearchThisAreaButton"];
      };
    };

const initialState: MapSearchState = {
  filters: {
    acceptsKids: undefined,
    acceptsLastMinRequests: undefined,
    acceptsPets: undefined,
    ageMin: undefined,
    ageMax: undefined,
    showEmptyProfile: undefined,
    drinkingAllowed: undefined,
    lastActive: 0,
    hasReferences: undefined,
    hasStrongVerification: undefined,
    hostingStatus: undefined,
    meetupStatus: undefined,
    numGuests: undefined,
    sleepingArrangement: undefined,
    smokesAtHome: undefined,
    sameGenderOnly: undefined,
  },
  hasActiveFilters: false,
  pageNumber: 1,
  search: {
    bbox: undefined,
    query: undefined,
  },
  selectedUserId: undefined,
  shouldSearchByUserId: false,
  showSearchThisAreaButton: false,
  uiOnly: {
    bbox: undefined,
    center: undefined,
    zoom: 1,
  },
};

const mapSearchReducer = (
  state: MapSearchState,
  action: MapSearchAction,
): MapSearchState => {
  // State is read-only. Don’t modify any objects or arrays in state directly 🚩.
  // Instead, always return new objects from your reducer ✅.
  switch (action.type) {
    case mapSearchActionTypes.CLEAR_KEYWORD_INPUT_VALUE:
      const meetsCriteriaAfterKeywordClear =
        state.hasActiveFilters ||
        state.search.bbox !== undefined ||
        state.shouldSearchByUserId;

      const defaultFiltersActive =
        state.filters.showEmptyProfile ||
        (state.filters.hostingStatus?.includes(
          HostingStatus.HOSTING_STATUS_CAN_HOST,
        ) &&
          state.filters.hostingStatus?.includes(
            HostingStatus.HOSTING_STATUS_MAYBE,
          ) &&
          !state.filters.hostingStatus.includes(
            HostingStatus.HOSTING_STATUS_CANT_HOST,
          ));

      return {
        ...state,
        ...(defaultFiltersActive && {
          hasActiveFilters: false,
          filters: {
            ...state.filters,
            hostingStatus: undefined,
            showEmptyProfile: false,
          },
        }),
        search: {
          ...state.search,
          query: initialState.search.query,
        },
        pageNumber: initialState.pageNumber,
        shouldSearchByUserId: state.selectedUserId !== undefined,
        showSearchThisAreaButton:
          !meetsCriteriaAfterKeywordClear &&
          state.uiOnly.zoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH,
      };

    case mapSearchActionTypes.SET_KEYWORD_INPUT_VALUE:
      return {
        ...state,
        search: {
          ...state.search,
          bbox: initialState.search.bbox,
          query: action.payload.keyword,
        },
        selectedUserId: initialState.selectedUserId,
        pageNumber: initialState.pageNumber,
        showSearchThisAreaButton: initialState.showSearchThisAreaButton,
        shouldSearchByUserId: initialState.shouldSearchByUserId,
      };
    case mapSearchActionTypes.CLEAR_SEARCH_INPUT_VALUE:
      const areDefaultFiltersActive =
        state.filters.showEmptyProfile ||
        (state.filters.hostingStatus?.includes(
          HostingStatus.HOSTING_STATUS_CAN_HOST,
        ) &&
          state.filters.hostingStatus?.includes(
            HostingStatus.HOSTING_STATUS_MAYBE,
          ) &&
          !state.filters.hostingStatus.includes(
            HostingStatus.HOSTING_STATUS_CANT_HOST,
          ));

      const clearedState = {
        ...state,
        ...(areDefaultFiltersActive && {
          filters: {
            ...state.filters,
            hostingStatus: undefined,
            showEmptyProfile: false,
          },
        }),
        search: {
          bbox: initialState.search.bbox,
          query: initialState.search.query,
        },
        pageNumber: initialState.pageNumber,
        shouldSearchByUserId: state.selectedUserId !== undefined,
      };

      const meetsCriteriaAfterSearchClear =
        getHasActiveFilters(clearedState, initialState) ||
        clearedState.search.query !== undefined ||
        clearedState.shouldSearchByUserId;

      return {
        ...clearedState,
        hasActiveFilters: getHasActiveFilters(clearedState, initialState),
        showSearchThisAreaButton:
          !meetsCriteriaAfterSearchClear &&
          state.uiOnly.zoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH,
      };

    case mapSearchActionTypes.SET_SEARCH_INPUT_VALUE:
      // We get a location when user searches search input

      const { center: newCenter, location, zoom: newZoom } = action.payload;
      const locationBbox = location?.bbox;

      if (!locationBbox) {
        return state; // Return the current state if locationBbox is undefined
      }

      const updatedState = {
        ...state,
        filters: {
          ...state.filters,
          hostingStatus: [
            HostingStatus.HOSTING_STATUS_CAN_HOST,
            HostingStatus.HOSTING_STATUS_MAYBE,
          ], // Default to can host and maybe when searching a location
          showEmptyProfile: false, // Default to not showing empty profiles when searching a location
        },
        search: {
          ...state.search,
          bbox: locationBbox,
          query: initialState.search.query,
        },
        selectedUserId: initialState.selectedUserId,
        shouldSearchByUserId: initialState.shouldSearchByUserId,
        showSearchThisAreaButton: initialState.showSearchThisAreaButton,
        uiOnly: {
          ...state.uiOnly,
          bbox: locationBbox,
          center: newCenter,
          zoom: newZoom ? newZoom : state.uiOnly.zoom,
        },
      };

      return {
        ...updatedState,
        hasActiveFilters: getHasActiveFilters(updatedState, initialState),
      };

    case mapSearchActionTypes.SET_MAP_QUERY_AREA: {
      const didCrossSearchThreshold = action.payload.didCrossSearchThreshold;
      const didZoomBelowThreshold =
        action.payload.zoom! < MAX_MAP_ZOOM_LEVEL_FOR_SEARCH &&
        state.uiOnly.zoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH;

      // If we zoom out below the threshold, reset the state to initial
      if (didZoomBelowThreshold) {
        return initialState;
      }

      return {
        ...state,
        ...(didCrossSearchThreshold && {
          hasActiveFilters: true,
          filters: {
            ...state.filters,
            hostingStatus: [
              HostingStatus.HOSTING_STATUS_CAN_HOST,
              HostingStatus.HOSTING_STATUS_MAYBE,
            ],
            showEmptyProfile: false,
          },
        }),
        search: {
          ...state.search,
          bbox: action.payload.bbox,
          query: initialState.search.query,
        },
        selectedUserId: initialState.selectedUserId,
        pageNumber: initialState.pageNumber,
        showSearchThisAreaButton: initialState.showSearchThisAreaButton,
        shouldSearchByUserId: initialState.shouldSearchByUserId,
        uiOnly: {
          ...state.uiOnly,
          zoom: action.payload.zoom ?? state.uiOnly.zoom,
        },
      };
    }
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
        if (key === "showEmptyProfile") {
          updatedFilters.showEmptyProfile = action.payload[key];
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
          updatedFilters.hostingStatus =
            action.payload[key] && action.payload[key].length === 0
              ? undefined
              : action.payload[key];
        }

        if (key === "meetupStatus") {
          updatedFilters.meetupStatus =
            action.payload[key] && action.payload[key].length === 0
              ? undefined
              : action.payload[key];
        }

        if (key === "lastActive") {
          updatedFilters.lastActive = action.payload[key];
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
        if (key === "sameGenderOnly") {
          updatedFilters.sameGenderOnly =
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
        pageNumber: initialState.pageNumber,
        shouldSearchByUserId: initialState.shouldSearchByUserId,
      };

    case mapSearchActionTypes.SET_PAGE_NUMBER:
      return {
        ...state,
        pageNumber: action.payload.pageNumber,
        shouldSearchByUserId: initialState.shouldSearchByUserId,
      };

    case mapSearchActionTypes.RESET_FILTERS:
      return {
        ...state,
        filters: initialState.filters,
        hasActiveFilters: initialState.hasActiveFilters,
        pageNumber: initialState.pageNumber,
        selectedUserId: initialState.selectedUserId,
        shouldSearchByUserId: initialState.shouldSearchByUserId,
      };

    case mapSearchActionTypes.SET_MOVE_MAP_UI_ONLY:
      const zoom = action.payload.zoom!;
      const center = action.payload.center;
      const bbox = action.payload.bbox;
      const didZoomBelowThreshold =
        zoom! < MAX_MAP_ZOOM_LEVEL_FOR_SEARCH &&
        state.uiOnly.zoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH;

      // If we zoom out below the threshold, reset the state to initial
      if (didZoomBelowThreshold) {
        return initialState;
      }

      return {
        ...state,
        uiOnly: {
          ...state.uiOnly,
          bbox: bbox ?? state.uiOnly.bbox,
          center: center ?? state.uiOnly.center,
          zoom: zoom ?? state.uiOnly.zoom,
        },
        shouldSearchByUserId: initialState.shouldSearchByUserId,
        showSearchThisAreaButton:
          zoom < MAX_MAP_ZOOM_LEVEL_FOR_SEARCH
            ? initialState.showSearchThisAreaButton
            : state.showSearchThisAreaButton,
      };

    case mapSearchActionTypes.SET_SELECTED_USER_ID:
      const currentSelectedUserId = state.selectedUserId;

      const meetsCriteriaAfterSelectedUserIdClear =
        state.hasActiveFilters ||
        state.search.bbox !== undefined ||
        state.search.query !== undefined;

      return {
        ...state,
        selectedUserId:
          currentSelectedUserId === action.payload.userId
            ? undefined
            : action.payload.userId,
        shouldSearchByUserId:
          currentSelectedUserId !== action.payload.userId &&
          action.payload.userId !== undefined &&
          !meetsCriteriaAfterSelectedUserIdClear,
        showSearchThisAreaButton:
          !meetsCriteriaAfterSelectedUserIdClear &&
          state.uiOnly.zoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH,
      };

    case mapSearchActionTypes.SET_SHOW_SEARCH_THIS_AREA_BUTTON:
      return {
        ...state,
        showSearchThisAreaButton: action.payload.showSearchThisAreaButton,
      };

    default:
      throw Error("Unknown action: " + action);
  }
};

export { initialState, mapSearchActionTypes, mapSearchReducer };
export type { MapSearchAction, MapSearchState };
