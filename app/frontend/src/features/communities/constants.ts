import { CommunityTab } from "routes";

export const communityTabBarLabels: Record<CommunityTab, string> = {
  overview: "Overview",
  info: "Local info",
  discussions: "Discussions",
  events: "Events",
};

export const getByCreator = (name: string) => `By ${name}`;
export const getAttendeesCount = (count: number) =>
  `${count} attendee${count === 1 ? "" : "s"}`;
export const CLOSE = "Close";
export const COMMENT = "Comment";
export const COMMENTS = "Comments";
export const COMMUNITY_HEADING = (name: string) => `Welcome to ${name}!`;
export const COMMUNITY_MODERATORS = "Community Builders";
export const COMMUNITY_PAGE_UPDATED =
  "The community page has been successfully updated.";
export const COMMUNITY_TABS_A11Y_LABEL = "Tabs for community sub-pages";
export const CREATED_AT = "Created at ";
export const CREATE_NEW_DISCUSSION_TITLE = "Create new post";
export const DISCUSSIONS_EMPTY_STATE = "No discussions at the moment.";
export const DISCUSSIONS_LABEL = "Discussions";
export const DISCUSSIONS_TITLE = "Discussions";
export const EDIT_LOCAL_INFO = "Edit local info";
export const ERROR_LOADING_COMMUNITY = "Error loading the community.";
export const EVENTS_EMPTY_STATE = "No events at the moment.";
export const FIND_HOST = "Find host";
export const FINISHED = "Finished";
export const GENERAL_INFORMATION = "General information";
export const HANGOUTS_LABEL = "Hangouts";
export const INVALID_COMMUNITY_ID = "Invalid community id.";
export const JOIN_COMMUNITY = "Join community";
export const LEAVE_COMMUNITY = "Leave community";
export const LOAD_EARLIER_COMMENTS = "Load earlier comments";
export const LOAD_EARLIER_REPLIES = "Load earlier replies";
export const LOAD_MORE_MODERATORS = "Load more Community Builders";
export const LOCAL_INFO_LABEL = "Local info";
export const LOCAL_INFO_LINK = "Go to local info";
export const LOCAL_INFO_TITLE = "Local info";
export const MORE_REPLIES = "More replies...";
export const MORE_TIPS = "More tips and information";
export const NEW_DISCUSSION_TITLE = "Discussion title";
export const NEW_DISCUSSION_TOPIC = "Discussion topic";
export const NEW_DISCUSSION_TOPIC_PLACEHOLDER =
  "Create a new discussion topic - e.g. My favourite Amsterdam moment is when...";
export const NEW_POST_LABEL = "New post";
export const NO_COMMENTS =
  "There are no comments in this discussion at the moment.";
export const NO_MODERATORS =
  "There aren't any Community Builders here at the moment.";
export const ONLINE = "Online";
export const OVERVIEW_LABEL = "Overview";
export const PAGE_CONTENT_FIELD_LABEL = "Page content";
export const PLACES_EMPTY_STATE = "No places to show yet.";
export const PLACES_TITLE = "Places";
export const POST = "Post";
export const PREVIOUS_PAGE = "Go back to previous page";
export const REPLY = "Reply";
export const REPLIES = "Replies";
export const SEE_ALL_MODERATORS = "See all Community Builders";
export const SEE_MORE_DISCUSSIONS_LABEL = "See more discussions";
export const SEE_MORE_INFORMATION = "See more information";
export const SEE_MORE_PLACES_LABEL = "See more places";
export const SHOW_ALL_EVENTS = "Show all events";
export const UNKNOWN_USER = "Unknown user";
export const UPLOAD_IMAGE = "Upload image";
export const UPLOAD_IMAGE_INSTRUCTIONS =
  "Use the following markdown to display this image:";
export const WRITE_COMMENT_A11Y_LABEL = "Write a comment";
