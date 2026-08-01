import { SearchUser } from "couchers/proto/search_pb";
import { FeatureCollection } from "geojson";
import { MapRef } from "react-map-gl/maplibre";

import userPin from "../resources/userPin.png";
import { MapSearchState } from "../state/mapSearchReducers";
import { Coordinates } from "./constants";
import { USERS_SOURCE_ID } from "./mapLayers";

const usersToGeoJSON = (pins: SearchUser.AsObject[]): FeatureCollection => ({
  type: "FeatureCollection",
  features: pins.map((pin) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [pin.lng, pin.lat], // GeoJSON expects [lng, lat]
    },
    properties: {
      id: pin.userId,
      hasCompletedProfile: pin.hasCompletedProfile,
    },
  })),
});

const clearMapFeatureState = (mapRef: React.RefObject<MapRef | null>) => {
  const map = mapRef.current?.getMap();
  if (map) {
    map.removeFeatureState({ source: USERS_SOURCE_ID });
  }
};

const setMapFeatureState = (
  mapRef: React.RefObject<MapRef | null>,
  id: string,
  selected: boolean,
) => {
  mapRef.current?.setFeatureState(
    { source: USERS_SOURCE_ID, id },
    { selected },
  );
};

const loadMapUserPins = async (mapRef: React.RefObject<MapRef | null>) => {
  const image = await mapRef.current?.loadImage(userPin.src);

  if (mapRef.current?.hasImage("user-pin")) return;

  if (image) {
    mapRef.current?.addImage("user-pin", image.data, { sdf: true });
  }
  return;
};

// @TODO(NA) - Maybe stringify state and initialState and compare them instead? As long as order is the same.
const getHasActiveFilters = (
  state: MapSearchState,
  initialState: MapSearchState,
) => {
  return (
    state.filters.ageMin !== initialState.filters.ageMin ||
    state.filters.ageMax !== initialState.filters.ageMax ||
    state.filters.acceptsPets !== initialState.filters.acceptsPets ||
    state.filters.hostingStatus !== initialState.filters.hostingStatus ||
    state.filters.numGuests !== initialState.filters.numGuests ||
    state.filters.showEmptyProfile !== initialState.filters.showEmptyProfile ||
    state.filters.acceptsKids !== initialState.filters.acceptsKids ||
    state.filters.acceptsLastMinRequests !==
      initialState.filters.acceptsLastMinRequests ||
    state.filters.drinkingAllowed !== initialState.filters.drinkingAllowed ||
    state.filters.hasReferences !== initialState.filters.hasReferences ||
    state.filters.sleepingArrangement !==
      initialState.filters.sleepingArrangement ||
    state.filters.hasStrongVerification !==
      initialState.filters.hasStrongVerification ||
    state.filters.smokesAtHome !== initialState.filters.smokesAtHome ||
    state.filters.lastActive !== initialState.filters.lastActive ||
    state.filters.sameGenderOnly !== initialState.filters.sameGenderOnly
  );
};

const getMapBounds = (mapRef: React.RefObject<MapRef | null>) => {
  const mapBounds = mapRef.current?.getMap().getBounds();
  if (!mapBounds) return;
  const ne = mapBounds.getNorthEast();
  const sw = mapBounds.getSouthWest();
  const bbox: Coordinates = [sw.lng, sw.lat, ne.lng, ne.lat];
  return bbox;
};

export {
  clearMapFeatureState,
  getHasActiveFilters,
  getMapBounds,
  loadMapUserPins,
  setMapFeatureState,
  usersToGeoJSON,
};
