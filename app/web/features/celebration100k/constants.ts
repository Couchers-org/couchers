import { donationsRoute } from "routes";

export const CELEBRATION_100K_FLAG = "celebration_100k_enabled";
// URL of the 100k blog post. "Read more" links stay hidden until it's set in GrowthBook
export const CELEBRATION_100K_BLOG_URL_FLAG = "celebration_100k_blog_url";
export const CELEBRATION_100K_SEEN_KEY = "celebration_100k.seen";
export const MEMBER_MILESTONE = 100000;

export const CELEBRATION_100K_DONATE_URL = `${donationsRoute}?utm_source=celebration_100k`;

// Logged-in members get the server's pre-clustered locations; logged-out visitors use the public map data
export const CLUSTERED_MEMBERS_PATH = "/geojson/clustered-users";
export const PUBLIC_MEMBERS_PATH = "/geojson/public-users";
