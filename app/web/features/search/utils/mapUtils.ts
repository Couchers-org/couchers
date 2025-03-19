import { FeatureCollection } from "geojson";
import { GeoJSONSource, LngLat } from "maplibre-gl";
import { User } from "proto/api_pb";
import { MapRef } from "react-map-gl/maplibre";

import userPin from "../resources/userPin.png";
import { MapSearchState } from "../state/mapSearchReducers";
import { Coordinates, MAX_MAP_ZOOM_LEVEL_FOR_SEARCH } from "./constants";
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
      id: pin.userId,
      hasCompletedProfile:
        pin.avatarUrl && pin.aboutMe && pin.aboutMe.length >= 150,
    },
  })),
});

const clearMapFeatureState = (mapRef: React.RefObject<MapRef>) => {
  const map = mapRef.current?.getMap();
  if (map) {
    map.removeFeatureState({ source: SOURCE_CLUSTERED_USERS_ID });
  }
};

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

// @TODO(NA) - Maybe stringify state and initialState and compare them instead? As long as order is the same.
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
    state.filters.smokesAtHome !== initialState.filters.smokesAtHome ||
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

const onClusterClick = async ({
  center,
  feature,
  hasSearchInputValue,
  mapRef,
  setSearch,
  setZoom,
  zoom,
}: {
  center: LngLat;
  feature: maplibregl.MapGeoJSONFeature;
  mapRef: React.RefObject<MapRef>;
  setSearch: (params: { bbox: Coordinates | undefined }) => void;
  setZoom: (zoom: number) => void;
  zoom: number;
  hasSearchInputValue: boolean;
}) => {
  const source = mapRef.current?.getSource(
    SOURCE_CLUSTERED_USERS_ID,
  ) as GeoJSONSource;

  let newZoom = await source.getClusterExpansionZoom(
    feature.properties.cluster_id,
  );

  // prevent it from hyper zooming rapidly
  if (newZoom - zoom > 5) {
    newZoom = zoom + 5;
  }

  mapRef.current?.easeTo({
    center,
    duration: 2000,
    zoom: newZoom,
  });

  // Wait for easing to complete before recalculating the bounds
  mapRef.current?.once("moveend", () => {
    if (
      zoom <= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH &&
      newZoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH &&
      !hasSearchInputValue
    ) {
      const bbox = getMapBounds(mapRef);
      setSearch({ bbox });
    }

    setZoom(newZoom);
  });
};

const onPointClick = ({
  feature,
  mapRef,
  selectedUserId,
  setSelectedUserId,
  zoom,
}: {
  feature: maplibregl.MapGeoJSONFeature;
  mapRef: React.RefObject<MapRef>;
  selectedUserId: number | undefined;
  setSelectedUserId: (userId: number) => void;
  zoom: number;
}) => {
  clearMapFeatureState(mapRef);

  // Don't turn pins orange and scroll if zoomed out too much as cards won't be there
  if (zoom < MAX_MAP_ZOOM_LEVEL_FOR_SEARCH) return;

  const userId = feature.properties.id;

  if (selectedUserId === userId) {
    setMapFeatureState(mapRef, userId, false);
  } else {
    setMapFeatureState(mapRef, userId, true);
  }

  setSelectedUserId(userId);
};

export {
  getHasActiveFilters,
  getMapBounds,
  loadMapUserPins,
  mapFlyToLocation,
  onClusterClick,
  onPointClick,
  setMapFeatureState,
  usersToGeoJSON,
};
