import { LngLatLike } from "maplibre-gl";

import { FilterOptions } from "@/features/search/SearchPage";
import { Coordinates } from "@/features/search/utils/constants";
import { GeocodeResult } from "@/utils/hooks";

import { useMapSearchDispatch } from "./mapSearchContext";
import { MapSearchState, mapSearchActionTypes } from "./mapSearchReducers";

const useMapSearchActions = () => {
  const dispatch = useMapSearchDispatch();

  const setMapQueryArea = (
    bbox: MapSearchState["search"]["bbox"],
    zoom?: MapSearchState["uiOnly"]["zoom"],
    didCrossSearchThreshold?: boolean,
  ) => {
    dispatch({
      type: mapSearchActionTypes.setMapQueryArea,
      payload: { bbox, zoom, didCrossSearchThreshold },
    });
  };

  const clearKeywordInputValue = () => {
    dispatch({
      type: mapSearchActionTypes.clearKeywordInputValue,
    });
  };

  const setKeywordInputValue = (keyword: string) => {
    dispatch({
      type: mapSearchActionTypes.setKeywordInputValue,
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
      type: mapSearchActionTypes.setSearchInputValue,
      payload: { location, center, zoom },
    });
  };

  const setSearchFilters = (newFilters: FilterOptions) => {
    dispatch({
      type: mapSearchActionTypes.setFilters,
      payload: newFilters,
    });
  };

  const clearSearchInputValue = (bbox: Coordinates | undefined) => {
    dispatch({
      type: mapSearchActionTypes.clearSearchInputValue,
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
      type: mapSearchActionTypes.setMoveMapUiOnly,
      payload: { bbox, center, zoom },
    });
  };

  const setSelectedUserId = (userId: number | undefined) => {
    dispatch({
      type: mapSearchActionTypes.setSelectedUserId,
      payload: { userId },
    });

    document
      .getElementById(`search-result-${userId ?? ""}`)
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const clearSearchFilters = () => {
    dispatch({ type: mapSearchActionTypes.resetFilters });
  };

  const setPageNumber = (pageNumber: number) => {
    dispatch({
      type: mapSearchActionTypes.setPageNumber,
      payload: { pageNumber },
    });
  };

  const setShowSearchThisAreaButton = (showSearchThisAreaButton: boolean) => {
    dispatch({
      type: mapSearchActionTypes.setShowSearchThisAreaButton,
      payload: { showSearchThisAreaButton },
    });
  };

  return {
    clearKeywordInputValue,
    clearSearchFilters,
    clearSearchInputValue,
    setKeywordInputValue,
    setMoveMapUIOnly,
    setPageNumber,
    setLocationInputValue,
    setMapQueryArea,
    setSearchFilters,
    setSelectedUserId,
    setShowSearchThisAreaButton,
  };
};

export { useMapSearchActions };
