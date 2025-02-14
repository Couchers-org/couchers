import { User } from "proto/api_pb";
import { UserSearchFilters } from "service/search";
import { GeocodeResult } from "utils/hooks";

import { FilterKey, FilterValue } from "./SearchPage";

enum mapSearchActionTypes {
  SET_FILTER = "SET_FILTER",
  RESET_FILTERS = "RESET_FILTERS",
  SET_SELECTED_USER_IDS = "SET_SELECTED_USER_IDS",
}

type MapSearchState = {
  filters: UserSearchFilters;
  selectedUserIds: User.AsObject["userId"][];
};

type MapSearchAction =
  | {
      type: mapSearchActionTypes.SET_FILTER;
      payload: { key: FilterKey; value: FilterValue };
    }
  | { type: mapSearchActionTypes.RESET_FILTERS }
  | {
      type: mapSearchActionTypes.SET_SELECTED_USER_IDS;
      payload: { userId: User.AsObject["userId"] };
    };

const initialState: MapSearchState = {
  filters: {
    query: "",
    bbox: [390, 82, -173, -66],
    lastActive: 0,
    hostingStatusOptions: [],
    numGuests: undefined,
    completeProfile: false,
  },
  selectedUserIds: [],
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
          filters: {
            ...state.filters,
            bbox: formattedBbox,
          },
        };
      } else if (action.payload.key === "query") {
        return {
          ...state,
          filters: {
            ...state.filters,
            query: action.payload.value as string,
          },
          selectedUserIds: [],
        };
      }

      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.key]: action.payload.value,
        },
        selectedUserIds: [],
      };
    case mapSearchActionTypes.RESET_FILTERS:
      return initialState;

    case mapSearchActionTypes.SET_SELECTED_USER_IDS:
      const currentSelectedUserIds = state.selectedUserIds;

      if (currentSelectedUserIds.includes(action.payload.userId)) {
        return {
          ...state,
          selectedUserIds: currentSelectedUserIds.filter(
            (userId) => userId !== action.payload.userId,
          ),
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
export type { MapSearchAction };
