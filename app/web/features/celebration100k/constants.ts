import { donationsRoute } from "routes";

export const CELEBRATION_100K_FLAG = "celebration_100k_enabled";
// URL of the 100k blog post. "Read more" links stay hidden until it's set in GrowthBook
export const CELEBRATION_100K_BLOG_URL_FLAG = "celebration_100k_blog_url";
export const CELEBRATION_100K_SEEN_KEY = "celebration_100k.seen";
export const MEMBER_MILESTONE = 100000;

export const CELEBRATION_100K_DONATE_URL = `${donationsRoute}?utm_source=celebration_100k`;

// Pre-clustered member locations. Logged-in only: the logged-out map data is far too big to download for this
export const CLUSTERED_MEMBERS_PATH = "/geojson/clustered-users";
