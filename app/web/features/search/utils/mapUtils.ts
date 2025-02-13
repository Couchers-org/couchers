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
      id: pin.userId,
      // No has completed profile here - is that only on the geojson endpoint?
      hasCompletedProfile:
        pin.avatarUrl && pin.aboutMe && pin.aboutMe.length >= 150,
      // username: pin.username,
      // city: pin.city,
      // age: pin.age,
      // gender: pin.gender,
      // hostingStatus: pin.hostingStatus,
      // avatarUrl: pin.avatarUrl,
      // Add other properties as needed
    },
  })),
});

export { usersToGeoJSON };
