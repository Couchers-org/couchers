export const EVENT_IMAGE_PLACEHOLDER_URL = "/img/eventImagePlaceholder.svg";

export const USER_LOCATION_MAX_RADIUS = 2000;
export const USER_LOCATION_MIN_RADIUS = 50;

export const PING_INTERVAL = 10000;

export const REACT_QUERY_RETRIES = 1;

export const grpcErrorStrings = {
  /* eslint-disable @typescript-eslint/naming-convention*/
  "Deadline exceeded":
    "Server took too long to respond. Please check your Internet connection or try again later.",
  "Http response at 400 or 500 level":
    "Couldn't connect to the server. Please check your Internet connection or try again later.",
  "upstream connect error or disconnect/reset before headers":
    "There was an internal server error. Please try again later.",
  /* eslint-enable @typescript-eslint/naming-convention*/
};

export type ObscureGrpcErrorMessages = keyof typeof grpcErrorStrings;

export const SESSION_COOKIE_NAME = "couchers-sesh";
