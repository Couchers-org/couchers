import { FeatureCollection } from "geojson";
import { User } from "proto/api_pb";

const usersToGeoJSON = (
  pins: User.AsObject[],
): FeatureCollection => ({
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

export { usersToGeoJSON };
