import { FeatureCollection } from "geojson";
import { User } from "proto/api_pb";
import { MapRef } from "react-map-gl/maplibre";

import userPin from "../resources/userPin.png";
import { MapSearchState } from "../state/mapSearchReducers";
import { Coordinates } from "./constants";
import { SOURCE_CLUSTERED_USERS_ID } from "./mapLayers";

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
    { source: SOURCE_CLUSTERED_USERS_ID, id },
    { selected },
  );
};

const loadMapUserPins = async (mapRef: React.RefObject<MapRef>) => {
  const image = await mapRef.current?.loadImage(userPin.src);

  if (mapRef.current?.hasImage("user-pin")) return;

  if (image) {
    mapRef.current?.addImage("user-pin", image.data, { sdf: true });
  }
  return;
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
    state.filters.sleepingArrangement !==
      initialState.filters.sleepingArrangement ||
    state.filters.hasStrongVerification !==
      initialState.filters.hasStrongVerification ||
    state.filters.smokingAllowed !== initialState.filters.smokingAllowed ||
    state.filters.lastActive !== initialState.filters.lastActive
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

const mapFlyToLocation = ({
  longitude,
  latitude,
  zoom = 12,
  mapRef,
}: {
  longitude: number;
  latitude: number;
  zoom: number | undefined;
  mapRef: React.RefObject<MapRef>;
}) => {
  mapRef.current?.flyTo({
    center: [longitude, latitude],
    zoom,
    duration: 2000,
  });
};

export {
  getHasActiveFilters,
  getMapBounds,
  loadMapUserPins,
  mapFlyToLocation,
  setMapFeatureState,
  usersToGeoJSON,
};
