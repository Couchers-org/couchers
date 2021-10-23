import { LngLat } from "maplibre-gl";

export const ABOUT = "About";
export const BLOG = "Blog";
export const GITHUB = "GitHub";
export const COMMUNITY = "Community";
export const COUCHERS = "Couchers.org";
export const DONATE = "Donate";
export const FAQ = "FAQ";
export const HANDBOOK = "Handbook";
export const FORUM = "Forum";
export const FOUNDATION = "Foundation";
export const HELP = "Help";
export const LOG_OUT = "Log out";
export const OUR_PLAN = "Our Plan";
export const OUR_TEAM = "Our Team";
export const TOWN_HALL = "Town Hall";
export const VOLUNTEER = "Volunteer";

export const DASHBOARD = "Dashboard";
export const EVENTS = "Events";
export const MESSAGES = "Messages";
export const MAP_SEARCH = "Map Search";
export const PROFILE = "Profile";

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

export type ObscureGrpcErrorMessages = keyof typeof grpcErrorStrings;
