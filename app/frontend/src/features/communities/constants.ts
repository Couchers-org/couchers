import { CommunityTab } from "routes";

export const communityTabBarLabels: Record<CommunityTab, string> = {
  overview: "Overview",
  "find-host": "Find host",
  events: "Events",
  "local-points": "Local points",
  discussions: "Discussions",
  hangouts: "Hangouts",
};

export const COMMUNITY_HEADING = (name: string) => `Welcome to ${name}!`;
export const COMMUNITY_TABS_A11Y_LABEL = "Tabs for community sub-pages";
export const CREATE_NEW_DISCUSSION_TITLE = "Create new post";
export const CREATE_NEW_DISCUSSION_TOPIC =
  "Create a new discussion topic - e.g. My favourite Amsterdam moment is when...";
export const DISCUSSIONS_EMPTY_STATE = "No discussions at the moment.";
export const DISCUSSIONS_LABEL = "Discussions";
export const DISCUSSIONS_TITLE = "Discussions";
export const ERROR_LOADING_COMMUNITY = "Error loading the community.";
export const EVENTS_EMPTY_STATE = "No events at the moment.";
export const EVENTS_LABEL = "Events";
export const EVENTS_TITLE = "Events";
export const FIND_HOST = "Find host";
export const HANGOUTS_LABEL = "Hangouts";
export const INVALID_COMMUNITY_ID = "Invalid community id.";
export const LOCAL_INFO_LABEL = "Local info";
export const MORE_REPLIES = "More replies...";
export const MORE_TIPS = "More tips and information";
export const NEW_DISCUSSION_TITLE = "Discussion title";
export const NEW_POST_LABEL = "New post";
export const OVERVIEW_LABEL = "Overview";
export const PLACES_EMPTY_STATE = "No places to show yet.";
export const PLACES_TITLE = "Places";
export const POST = "Post";
export const SEE_MORE_DISCUSSIONS_LABEL = "See more discussions";
export const SEE_MORE_EVENTS_LABEL = "See more events";
export const SEE_MORE_PLACES_LABEL = "See more places";
