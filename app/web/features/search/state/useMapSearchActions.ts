import { FilterOptions, SearchOptions } from "../SearchPage";
import { useMapSearchDispatch } from "../state/mapSearchContext";
import { mapSearchActionTypes } from "../state/mapSearchReducers";
import { Coordinates } from "../utils/constants";

export interface FlyToLocationProps {
  longitude: number;
  latitude: number;
  zoom?: number;
}

function useMapSearchActions() {
  const dispatch = useMapSearchDispatch();

  //   const flyToLocation = useCallback(
  //     ({ longitude, latitude, zoom }: FlyToLocationProps) => {
  //       mapFlyToLocation({ longitude, latitude, zoom, mapRef });
  //     },
  //     [mapRef],
  //   );

  const setSearch = (search: SearchOptions) => {
    dispatch({
      type: mapSearchActionTypes.SET_SEARCH,
      payload: search,
    });

    // if (search.location) {
    //   const geojson = search.location as GeocodeResult;
    //   flyToLocation({
    //     longitude: geojson.location.lng,
    //     latitude: geojson.location.lat,
    //   });
    // }
  };

  const setSearchFilters = (newFilters: FilterOptions) => {
    dispatch({
      type: mapSearchActionTypes.SET_FILTERS,
      payload: newFilters,
    });
  };

  const clearSearchInputValue = (currentBbox: Coordinates | undefined) => {
    dispatch({
      type: mapSearchActionTypes.CLEAR_SEARCH_INPUT_VALUE,
      payload: { bbox: currentBbox },
    });
  };

  const setSelectedUserIds = (userId: number) => {
    dispatch({
      type: mapSearchActionTypes.SET_SELECTED_USER_IDS,
      payload: { userId },
    });

    document
      .getElementById(`search-result-${userId}`)
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const clearSearchFilters = () => {
    dispatch({ type: mapSearchActionTypes.RESET_FILTERS });
  };

  const setZoom = (newZoom: number) => {
    dispatch({
      type: mapSearchActionTypes.SET_ZOOM,
      payload: { zoom: newZoom },
    });
  };

  return {
    setSearch,
    setSearchFilters,
    clearSearchInputValue,
    setSelectedUserIds,
    clearSearchFilters,
    setZoom,
  };
}

export { useMapSearchActions };
