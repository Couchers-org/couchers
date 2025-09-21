import { ReferenceType } from "@/proto/references_pb";

// profiles/users
export const LANGUAGES_KEY = "languages";
export const REGIONS_KEY = "regions";
export const BADGES_KEY = "badges";
export const BLOCKED_USER_IDS_KEY = "blockedUserIds";
export const BLOCKED_USERS_KEY = "blockedUsers";
export const FRIEND_IDS_KEY = "friendIds";
export const CONTRIBUTOR_FORM_INFO_QUERY_KEY = "contributorFormInfo";
export const ACCOUNT_INFO_QUERY_KEY = "accountInfo";
export const SIGNUP_INFO_QUERY_KEY = "signupInfo";
export const DO_NOT_EMAIL_QUERY_KEY = "doNotEmail";
export const TOS_QUERY_KEY = "tos";
export const COMMUNITY_GUIDELINES_QUERY_KEY = "communityGuidelines";
export const NOTIFICATION_SETTINGS_QUERY_KEY = "notificationSettings";
export const LIST_NOTIFICATIONS_QUERY_KEY = "listNotifications";
export const USERNAME_2_ID = "username2Id";

export const userKey = (userId?: bigint) => {
  return userId === undefined ? ["user"] : ["user", userId];
};

export const modUserKey = (user?: string) => {
  return user === undefined ? "modUser" : ["modUser", user];
};
export const modUserDetailsKey = (user?: string) => {
  return user === undefined ? "modUserDetails" : ["modUserDetails", user];
};

export const liteUserKey = (userId?: number) => {
  return userId === undefined ? ["liteUser"] : ["liteUser", userId];
};

export const liteUsersKey = (ids: number[] | string[]) => ["liteUsers", ...ids];

export const REFERENCES_GIVEN_KEY = "referencesGiven";

export const REFERENCES_RECEIVED_BASE_KEY = "referencesReceived";
export interface ReferencesReceivedKeyInputs {
  userId: number;
  type: ReferenceType | "all";
}
export const referencesReceivedKey = ({
  userId,
  type,
}: ReferencesReceivedKeyInputs) => [
  REFERENCES_RECEIVED_BASE_KEY,
  { type, userId },
];

export const availableWriteReferencesKey = (userId: number) => [
  "availableWriteReferences",
  { userId },
];

export type FriendRequestType = "sent" | "received";
export const friendRequestKey = (type: FriendRequestType) => [
  "friendRequests",
  { type },
];

// communities
export const communityKey = (id: number) => ["community", id];
export const subCommunitiesKey = (communityId: number) => [
  "subCommunities",
  communityId,
];
export const communityGroupsKey = (communityId: number) => [
  "communityGroups",
  communityId,
];
export const communityGuidesKey = (communityId: number) => [
  "communityGuides",
  communityId,
];
export const communityPlacesKey = (communityId: number) => [
  "communityPlaces",
  communityId,
];
export const communityDiscussionsKey = (communityId: number) => [
  "communityDiscussions",
  communityId,
];

// Determines whether only some entities can be revealed or all can be revealed
// with a fetch more button
export type QueryType = "summary" | "all";
export const communityAdminsKey = (communityId: number, type: QueryType) => [
  "communityAdmins",
  { communityId, type },
];

export const communityMembersKey = (communityId: number) => [
  "communityMembers",
  communityId,
];
export const communityNearbyUsersKey = (communityId: number) => [
  "communityNearbyUsers",
  communityId,
];

export const COMMUNITY_EVENTS_BASE_KEY = "communityEvents";
export const communityEventsKey = (communityId: number, type: QueryType) => [
  COMMUNITY_EVENTS_BASE_KEY,
  communityId,
  { type },
];

// events
export const eventKey = (eventId: number) => ["event", eventId];
export type EventsType = "upcoming" | "past";
export const eventsKey = (type: EventsType) => ["events", { type }];
export interface EventUsersInput {
  eventId: number;
  type: QueryType;
}

export const EVENT_ORGANIZERS_BASE_KEY = "eventOrganizers";
export const eventOrganizersKey = ({ eventId, type }: EventUsersInput) => [
  EVENT_ORGANIZERS_BASE_KEY,
  eventId,
  ...(type === "summary" ? ["summary"] : []),
];
export const EVENT_ATTENDEES_BASE_KEY = "eventAttendees";
export const eventAttendeesKey = ({ eventId, type }: EventUsersInput) => [
  EVENT_ATTENDEES_BASE_KEY,
  eventId,
  { type },
];

export const discussionKey = (discussionId: number) => [
  "discussion",
  discussionId,
];
export const threadKey = (threadId: number) => ["thread", threadId];

// messaging
export const GROUP_CHATS_LIST_KEY = "groupChatsList";
export const groupChatKey = (groupChatId: number) => ["groupChat", groupChatId];
export const groupChatMessagesKey = (groupChatId: number) => [
  "groupChatMessages",
  groupChatId,
];
export const hostRequestsListKey = (filters?: {
  onlyActive: boolean;
  type: "all" | "hosting" | "surfing";
}) => (filters ? ["hostRequests", filters] : ["hostRequests"]);
export const hostRequestKey = (id?: number) => ["hostRequest", id];
export const hostRequestMessagesKey = (id?: number) => [
  "hostRequestMessages",
  id,
];

// Search
export const searchQueryKey = (query?: string) =>
  query ? ["search", query] : ["search"];

// User
export const USER_COMMUNITIES_KEY = "userCommunities";
export const myEventsKey = (type: EventsType) => ["myEvents", { type }];
export const ACTIVE_LOGINS_KEY = "activeLogins";

// Badges
export interface BadgeUsersInput {
  badgeId: string;
}
export const badgeUsersKey = ({ badgeId }: BadgeUsersInput) => [
  "badgeUsers",
  badgeId,
];

// mod
export const NEW_USERS_LIST_KEY = "newUsersList";
