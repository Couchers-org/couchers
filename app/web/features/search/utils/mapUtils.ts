import { FeatureCollection } from "geojson";
import { SearchUser } from "proto/search_pb";
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

const setMapFeatureState = (mapRef: React.RefObject<MapRef | null>, id: string, selected: boolean) => {
  mapRef.current?.setFeatureState({ source: USERS_SOURCE_ID, id }, { selected });
};

const loadMapUserPins = async (mapRef: React.RefObject<MapRef | null>) => {
  const image = await mapRef.current?.loadImage(userPin.src);

  if (mapRef.current?.hasImage("user-pin")) return;

  if (image) {
    mapRef.current?.addImage("user-pin", image.data, { sdf: true });
  }
  return;
};

const getHasActiveFilters = (state: MapSearchState, initialState: MapSearchState) =>
  (Object.keys(initialState.filters) as (keyof MapSearchState["filters"])[]).some(
    (key) => state.filters[key] !== initialState.filters[key],
  );

const getMapBounds = (mapRef: React.RefObject<MapRef | null>) => {
  const mapBounds = mapRef.current?.getMap().getBounds();
  if (!mapBounds) return;
  const ne = mapBounds.getNorthEast();
  const sw = mapBounds.getSouthWest();
  const bbox: Coordinates = [sw.lng, sw.lat, ne.lng, ne.lat];
  return bbox;
};

export { clearMapFeatureState, getHasActiveFilters, getMapBounds, loadMapUserPins, setMapFeatureState, usersToGeoJSON };
