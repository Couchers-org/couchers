import { FeatureCollection } from "geojson";
import { User } from "proto/api_pb";
import { MapRef } from "react-map-gl/maplibre";
import userPin from "../resources/userPin.png";

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

export { loadMapUserPins, setMapFeatureState, usersToGeoJSON };
