import { FilterOptions, SearchOptions } from "../SearchPage";
import { useMapSearchDispatch } from "../state/mapSearchContext";
import { mapSearchActionTypes } from "../state/mapSearchReducers";

export interface FlyToLocationProps {
  longitude: number;
  latitude: number;
  zoom?: number;
}

function useMapSearchActions() {
  const dispatch = useMapSearchDispatch();

  const setSearch = (search: SearchOptions) => {
    dispatch({
      type: mapSearchActionTypes.SET_SEARCH,
      payload: search,
    });
  };

  const setSearchFilters = (newFilters: FilterOptions) => {
    dispatch({
      type: mapSearchActionTypes.SET_FILTERS,
      payload: newFilters,
    });
  };

  const clearSearchInputValue = () => {
    dispatch({
      type: mapSearchActionTypes.CLEAR_SEARCH_INPUT_VALUE,
    });
  };

  const setMoveMap = () => {
    dispatch({ type: mapSearchActionTypes.SET_MOVE_MAP });
  };

  const setSelectedUserId = (userId: number) => {
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
    setMoveMap,
    setSelectedUserId,
    clearSearchFilters,
    setZoom,
  };
}

export { useMapSearchActions };
