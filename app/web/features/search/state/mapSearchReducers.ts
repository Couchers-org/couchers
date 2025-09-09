import { LngLatLike } from "maplibre-gl";

import { FilterOptions } from "@/features/search/SearchPage";
import {
  Coordinates,
  DEFAULT_AGE_MAX,
  DEFAULT_AGE_MIN,
  MAX_MAP_ZOOM_LEVEL_FOR_SEARCH,
} from "@/features/search/utils/constants";
import { getHasActiveFilters } from "@/features/search/utils/mapUtils";
import { HostingStatus, User } from "@/proto/api_pb";
import { UserSearchFilters } from "@/service/search";
import { GeocodeResult } from "@/utils/hooks";

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
enum MapSearchActionTypes {
  setInitialState = "SET_INITIAL_STATE",
  setMapQueryArea = "SET_MAP_QUERY_AREA",
  clearKeywordInputValue = "CLEAR_KEYWORD_INPUT_VALUE",
  setKeywordInputValue = "SET_KEYWORD_INPUT_VALUE",
  setSearchInputValue = "SET_SEARCH_INPUT_VALUE",
  clearSearchInputValue = "CLEAR_SEARCH_INPUT_VALUE",
  setFilters = "SET_FILTERS",
  resetFilters = "RESET_FILTERS",
  setMoveMapUiOnly = "SET_MOVE_MAP_UI_ONLY",
  setPageNumber = "SET_PAGE_NUMBER",
  setSelectedUserId = "SET_SELECTED_USER_ID",
  setShowSearchThisAreaButton = "SET_SHOW_SEARCH_THIS_AREA_BUTTON",
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
  shouldShowSearchThisAreaButton: boolean;
  uiOnly: {
    bbox: Coordinates | undefined;
    center: LngLatLike | undefined;
    zoom: number;
  };
};

// The action types for the map search reducer
type MapSearchAction =
  | {
      type: MapSearchActionTypes.clearKeywordInputValue;
    }
  | {
      type: MapSearchActionTypes.setKeywordInputValue;
      payload: {
        keyword: string;
      };
    }
  | {
      type: MapSearchActionTypes.setSearchInputValue;
      payload: {
        location: GeocodeResult | undefined;
        zoom: MapSearchState["uiOnly"]["zoom"] | undefined;
        center: MapSearchState["uiOnly"]["center"] | undefined;
      };
    }
  | {
      type: MapSearchActionTypes.setMapQueryArea;
      payload: {
        bbox: MapSearchState["search"]["bbox"];
        zoom?: MapSearchState["uiOnly"]["zoom"] | undefined;
        didCrossSearchThreshold?: boolean;
      };
    }
  | {
      type: MapSearchActionTypes.clearSearchInputValue;
      payload: { bbox: MapSearchState["search"]["bbox"] };
    }
  | {
      type: MapSearchActionTypes.setMoveMapUiOnly;
      payload: {
        bbox?: MapSearchState["uiOnly"]["bbox"];
        center?: MapSearchState["uiOnly"]["center"];
        zoom?: MapSearchState["uiOnly"]["zoom"];
      };
    }
  | {
      type: MapSearchActionTypes.setFilters;
      payload: FilterOptions;
    }
  | {
      type: MapSearchActionTypes.setPageNumber;
      payload: { pageNumber: MapSearchState["pageNumber"] };
    }
  | { type: MapSearchActionTypes.resetFilters }
  | {
      type: MapSearchActionTypes.setSelectedUserId;
      payload: {
        userId: User.AsObject["userId"] | undefined;
      };
    }
  | {
      type: MapSearchActionTypes.setShowSearchThisAreaButton;
      payload: {
        showSearchThisAreaButton: MapSearchState["shouldShowSearchThisAreaButton"];
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
  },
  hasActiveFilters: false,
  pageNumber: 1,
  search: {
    bbox: undefined,
    query: undefined,
  },
  selectedUserId: undefined,
  shouldSearchByUserId: false,
  shouldShowSearchThisAreaButton: false,
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
    case MapSearchActionTypes.clearKeywordInputValue: {
      const doesMeetCriteriaAfterKeywordClear =
        state.hasActiveFilters ||
        state.search.bbox !== undefined ||
        state.shouldSearchByUserId;

      const hasDefaultFiltersActive =
        state.filters.showEmptyProfile ||
        (state.filters.hostingStatus?.includes(
          HostingStatus.HOSTING_STATUS_CAN_HOST,
        ) &&
          state.filters.hostingStatus.includes(
            HostingStatus.HOSTING_STATUS_MAYBE,
          ) &&
          !state.filters.hostingStatus.includes(
            HostingStatus.HOSTING_STATUS_CANT_HOST,
          ));

      return {
        ...state,
        ...(hasDefaultFiltersActive && {
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
        shouldShowSearchThisAreaButton:
          !doesMeetCriteriaAfterKeywordClear &&
          state.uiOnly.zoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH,
      };
    }

    case MapSearchActionTypes.setKeywordInputValue:
      return {
        ...state,
        search: {
          ...state.search,
          bbox: initialState.search.bbox,
          query: action.payload.keyword,
        },
        selectedUserId: initialState.selectedUserId,
        pageNumber: initialState.pageNumber,
        shouldShowSearchThisAreaButton:
          initialState.shouldShowSearchThisAreaButton,
        shouldSearchByUserId: initialState.shouldSearchByUserId,
      };
    case MapSearchActionTypes.clearSearchInputValue: {
      const doesMeetCriteriaAfterSearchClear =
        state.hasActiveFilters ||
        state.search.query !== undefined ||
        state.shouldSearchByUserId;

      const hasDefaultFiltersActive =
        state.filters.showEmptyProfile ||
        (state.filters.hostingStatus &&
          state.filters.hostingStatus.includes(
            HostingStatus.HOSTING_STATUS_CAN_HOST,
          ) &&
          state.filters.hostingStatus.includes(
            HostingStatus.HOSTING_STATUS_MAYBE,
          ) &&
          !state.filters.hostingStatus.includes(
            HostingStatus.HOSTING_STATUS_CANT_HOST,
          ));

      return {
        ...state,
        ...(hasDefaultFiltersActive && {
          hasActiveFilters: false,
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
        shouldShowSearchThisAreaButton:
          !doesMeetCriteriaAfterSearchClear &&
          state.uiOnly.zoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH,
      };
    }

    case MapSearchActionTypes.setSearchInputValue: {
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
        showSearchThisAreaButton: initialState.shouldShowSearchThisAreaButton,
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
    }

    case MapSearchActionTypes.setMapQueryArea: {
      const didCrossSearchThreshold = action.payload.didCrossSearchThreshold;
      const didZoomBelowThreshold =
        (action.payload.zoom || MAX_MAP_ZOOM_LEVEL_FOR_SEARCH) <
          MAX_MAP_ZOOM_LEVEL_FOR_SEARCH &&
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
        shouldShowSearchThisAreaButton:
          initialState.shouldShowSearchThisAreaButton,
        shouldSearchByUserId: initialState.shouldSearchByUserId,
        uiOnly: {
          ...state.uiOnly,
          zoom: action.payload.zoom ?? state.uiOnly.zoom,
        },
      };
    }
    case MapSearchActionTypes.setFilters: {
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
    }

    case MapSearchActionTypes.setPageNumber:
      return {
        ...state,
        pageNumber: action.payload.pageNumber,
        shouldSearchByUserId: initialState.shouldSearchByUserId,
      };

    case MapSearchActionTypes.resetFilters:
      return {
        ...state,
        filters: initialState.filters,
        hasActiveFilters: initialState.hasActiveFilters,
        pageNumber: initialState.pageNumber,
        selectedUserId: initialState.selectedUserId,
        shouldSearchByUserId: initialState.shouldSearchByUserId,
      };

    case MapSearchActionTypes.setMoveMapUiOnly: {
      const zoom = action.payload.zoom || 0;
      const center = action.payload.center;
      const bbox = action.payload.bbox;
      const didZoomBelowThreshold =
        zoom < MAX_MAP_ZOOM_LEVEL_FOR_SEARCH &&
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
          zoom,
        },
        shouldSearchByUserId: initialState.shouldSearchByUserId,
        shouldShowSearchThisAreaButton:
          zoom < MAX_MAP_ZOOM_LEVEL_FOR_SEARCH
            ? initialState.shouldShowSearchThisAreaButton
            : state.shouldShowSearchThisAreaButton,
      };
    }
    case MapSearchActionTypes.setSelectedUserId: {
      const currentSelectedUserId = state.selectedUserId;

      const doesMeetCriteriaAfterSelectedUserIdClear =
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
          !doesMeetCriteriaAfterSelectedUserIdClear,
        shouldShowSearchThisAreaButton:
          !doesMeetCriteriaAfterSelectedUserIdClear &&
          state.uiOnly.zoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH,
      };
    }

    case MapSearchActionTypes.setShowSearchThisAreaButton:
      return {
        ...state,
        shouldShowSearchThisAreaButton: action.payload.showSearchThisAreaButton,
      };
  }
};

export {
  initialState,
  MapSearchActionTypes as mapSearchActionTypes,
  mapSearchReducer,
};
export type { MapSearchAction, MapSearchState };
