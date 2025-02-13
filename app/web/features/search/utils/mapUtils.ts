import { FeatureCollection } from "geojson";
import { User } from "proto/api_pb";

const usersToGeoJSON = (pins: User.AsObject[]): FeatureCollection => ({
  type: "FeatureCollection",
  features: pins.map((pin) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [pin.lng, pin.lat], // GeoJSON expects [lng, lat]
    },
    properties: {
      userId: pin.userId,
      username: pin.username,
      city: pin.city,
      age: pin.age,
      gender: pin.gender,
      hostingStatus: pin.hostingStatus,
      avatarUrl: pin.avatarUrl,
      // Add other properties as needed
    },
  })),
});

export { usersToGeoJSON };
