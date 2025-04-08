import { LngLatLike } from "maplibre-gl";
import { GeocodeResult } from "utils/hooks";

import { FilterOptions } from "../SearchPage";
import { useMapSearchDispatch } from "../state/mapSearchContext";
import {
  mapSearchActionTypes,
  MapSearchState,
} from "../state/mapSearchReducers";
import { Coordinates } from "../utils/constants";

export interface FlyToLocationProps {
  longitude: number;
  latitude: number;
  zoom?: number;
}

function useMapSearchActions() {
  const dispatch = useMapSearchDispatch();

  const setInitialState = () => {
    dispatch({
      type: mapSearchActionTypes.SET_INITIAL_STATE,
    });
  };

  const setSearchThisArea = (bbox: Coordinates | undefined) => {
    dispatch({
      type: mapSearchActionTypes.SET_SEARCH_THIS_AREA,
      payload: { bbox },
    });
  };

  const clearKeywordInputValue = () => {
    dispatch({
      type: mapSearchActionTypes.CLEAR_KEYWORD_INPUT_VALUE,
    });
  };

  const setKeywordInputValue = (keyword: string) => {
    dispatch({
      type: mapSearchActionTypes.SET_KEYWORD_INPUT_VALUE,
      payload: { keyword },
    });
  };

  const setLocationInputValue = ({
    location,
    center,
    zoom,
  }: {
    location: GeocodeResult | undefined;
    center: LngLatLike | undefined;
    zoom: number | undefined;
  }) => {
    dispatch({
      type: mapSearchActionTypes.SET_SEARCH_INPUT_VALUE,
      payload: { location, center, zoom },
    });
  };

  const setSearchFilters = (newFilters: FilterOptions) => {
    dispatch({
      type: mapSearchActionTypes.SET_FILTERS,
      payload: newFilters,
    });
  };

  const clearSearchInputValue = (bbox: Coordinates | undefined) => {
    dispatch({
      type: mapSearchActionTypes.CLEAR_SEARCH_INPUT_VALUE,
      payload: { bbox },
    });
  };

  const setMoveMapUIOnly = ({
    bbox,
    center,
    zoom,
  }: {
    bbox?: MapSearchState["uiOnly"]["bbox"];
    center?: MapSearchState["uiOnly"]["center"];
    zoom?: MapSearchState["uiOnly"]["zoom"];
  }) => {
    dispatch({
      type: mapSearchActionTypes.SET_MOVE_MAP_UI_ONLY,
      payload: { bbox, center, zoom },
    });
  };

  const setSelectedUserId = (userId: number | undefined) => {
    dispatch({
      type: mapSearchActionTypes.SET_SELECTED_USER_ID,
      payload: { userId },
    });

    document
      .getElementById(`search-result-${userId}`)
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const clearSearchFilters = () => {
    dispatch({ type: mapSearchActionTypes.RESET_FILTERS });
  };

  const setPageNumber = (pageNumber: number) => {
    dispatch({
      type: mapSearchActionTypes.SET_PAGE_NUMBER,
      payload: { pageNumber },
    });
  };

  return {
    clearKeywordInputValue,
    clearSearchFilters,
    clearSearchInputValue,
    setKeywordInputValue,
    setInitialState,
    setMoveMapUIOnly,
    setPageNumber,
    setLocationInputValue,
    setSearchThisArea,
    setSearchFilters,
    setSelectedUserId,
  };
}

export { useMapSearchActions };
