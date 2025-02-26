import { FeatureCollection } from "geojson";
import { User } from "proto/api_pb";
import { MapRef } from "react-map-gl/maplibre";

import { MapSearchState } from "../mapSearchReducers";
import userPin from "../resources/userPin.png";
import { Coordinates, MAX_MAP_ZOOM_LEVEL_FOR_SEARCH } from "./constants";

const usersToGeoJSON = (pins: User.AsObject[]): FeatureCollection => ({
  type: "FeatureCollection",
  features: pins.map((pin) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [pin.lng, pin.lat], // GeoJSON expects [lng, lat]
    },
    properties: {
      avatarUrl: pin.avatarUrl,
      id: pin.userId,
      hasCompletedProfile:
        pin.avatarUrl && pin.aboutMe && pin.aboutMe.length >= 150,
      name: pin.name,
      username: pin.username,
      city: pin.city,
      age: pin.age,
      avatarThumbnailUrl: pin.avatarThumbnailUrl,
      lat: pin.lat,
      lng: pin.lng,
      radius: pin.radius,
      hasStrongVerification: pin.hasStrongVerification,
      timezone: pin.timezone,
    },
  })),
});

const setMapFeatureState = (
  mapRef: React.RefObject<MapRef>,
  id: string,
  selected: boolean,
) => {
  mapRef.current?.setFeatureState(
    { source: "clustered-users", id },
    { selected },
  );
};

const loadMapUserPins = async (mapRef: React.RefObject<MapRef>) => {
  const image = await mapRef.current?.loadImage(userPin.src);

  if (mapRef.current?.hasImage("user-pin")) return;

  if (image) {
    mapRef.current?.addImage("user-pin", image.data, { sdf: true });
  }
};

const getHasActiveFilters = (
  state: MapSearchState,
  initialState: MapSearchState,
) => {
  return (
    state.filters.ageMin !== initialState.filters.ageMin ||
    state.filters.ageMax !== initialState.filters.ageMax ||
    state.filters.acceptsPets !== initialState.filters.acceptsPets ||
    state.filters.hostingStatusOptions !==
      initialState.filters.hostingStatusOptions ||
    state.filters.numGuests !== initialState.filters.numGuests ||
    state.filters.completeProfile !== initialState.filters.completeProfile ||
    state.filters.acceptsKids !== initialState.filters.acceptsKids ||
    state.filters.acceptsLastMinRequests !==
      initialState.filters.acceptsLastMinRequests ||
    state.filters.drinkingAllowed !== initialState.filters.drinkingAllowed ||
    state.filters.hasReferences !== initialState.filters.hasReferences ||
    state.filters.hasStrongVerification !==
      initialState.filters.hasStrongVerification ||
    state.filters.smokingAllowed !== initialState.filters.smokingAllowed
  );
};

const getMapBounds = (mapRef: React.RefObject<MapRef>) => {
  const mapBounds = mapRef.current?.getMap().getBounds();
  if (!mapBounds) return;
  const ne = mapBounds.getNorthEast();
  const sw = mapBounds.getSouthWest();
  const bbox: Coordinates = [sw.lng, sw.lat, ne.lng, ne.lat];
  return bbox;
};

const meetsApiSearchCriteria = ({
  hasActiveFilters,
  hasSearchInputValue,
  zoom,
}: {
  hasActiveFilters: MapSearchState["hasActiveFilters"];
  hasSearchInputValue: MapSearchState["hasSearchInputValue"];
  zoom: number;
}) => {
  return (
    hasActiveFilters ||
    hasSearchInputValue ||
    zoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH
  );
};

export {
  getHasActiveFilters,
  getMapBounds,
  loadMapUserPins,
  meetsApiSearchCriteria,
  setMapFeatureState,
  usersToGeoJSON,
};
