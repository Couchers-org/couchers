import { LngLat } from "maplibre-gl";

export const userLocationMaxRadius = 2000;
export const userLocationMinRadius = 50;
export const userLocationDefault = new LngLat(-0.1, 51.5);
export const userLocationDefaultRadius = 500;

export const pingInterval = 10000;

export const reactQueryRetries = 1;

export const grpcTimeout = 10000; //milliseconds

export const grpcErrorStrings = {
  "Deadline exceeded":
    "Server took too long to respond. Please check your Internet connection or try again later.",
  "Http response at 400 or 500 level":
    "Couldn't connect to the server. Please check your Internet connection or try again later.",
  "upstream connect error or disconnect/reset before headers":
    "There was an internal server error. Please try again later.",
};
