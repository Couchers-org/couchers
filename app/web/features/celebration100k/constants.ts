import { blogRoute, donationsRoute } from "routes";

export const CELEBRATION_100K_FLAG = "celebration_100k_enabled";
export const CELEBRATION_100K_SEEN_KEY = "celebration_100k.seen";
export const MEMBER_MILESTONE = 100000;

// TODO: point at the 100k blog post once it's published
export const CELEBRATION_100K_BLOG_URL = blogRoute;
export const CELEBRATION_100K_DONATE_URL = `${donationsRoute}?utm_source=celebration_100k`;

// Logged-in members get the server's pre-clustered locations; logged-out visitors use the public map data
export const CLUSTERED_MEMBERS_PATH = "/geojson/clustered-users";
export const PUBLIC_MEMBERS_PATH = "/geojson/public-users";
