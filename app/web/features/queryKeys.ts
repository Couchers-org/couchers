import { ReferenceType } from "proto/references_pb";

// profiles/users
export const languagesKey = "languages";
export const regionsKey = "regions";
export const badgesKey = "badges";
export const blockedUsersKey = "blockedUsers";
export const friendIdsKey = "friendIds";
export const accountInfoQueryKey = "accountInfo";
export const doNotEmailQueryKey = "doNotEmail";
export const tosQueryKey = "tos";
export const communityGuidelinesQueryKey = "communityGuidelines";
export const notificationSettingsQueryKey = "notificationSettings";
export const listMyCommunitiesDiscussionsKey = "listMyCommunitiesDiscussions";
export const listNotificationsQueryKey = "listNotifications";
export const pingQueryKey = "ping";
export const username2Id = "username2Id";
export const volunteerInfoQueryKey = "volunteerInfo";

export function userKey(userId?: number) {
  return userId === undefined ? ["user"] : ["user", userId];
}

export function modUserKey(user?: string) {
  return user === undefined ? "modUser" : ["modUser", user];
}
export function modUserDetailsKey(user?: string) {
  return user === undefined ? "modUserDetails" : ["modUserDetails", user];
}

export function liteUserKey(userId?: number) {
  return userId === undefined ? ["liteUser"] : ["liteUser", userId];
}

export const liteUsersKey = (ids: number[] | string[]) => ["liteUsers", ...ids];

export const referencesGivenKey = "referencesGiven";

export const referencesReceivedBaseKey = "referencesReceived";
export interface ReferencesReceivedKeyInputs {
  userId: number;
  type: ReferenceType | "all";
}

export const availableWriteReferencesKey = (userId: number) => [
  "availableWriteReferences",
  { userId },
];

export const hasGivenHostRequestReferenceKey = "hasGivenHostRequestReference";

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

export const communityEventsBaseKey = "communityEvents";
export const communityEventsKey = (communityId: number, type: QueryType) => [
  communityEventsBaseKey,
  communityId,
  { type },
];

// events
export const eventKey = (eventId: number) => ["event", eventId];
export type EventsType = "upcoming" | "past";
interface EventUsersInput {
  eventId: number;
  type: QueryType;
}

const eventOrganizersBaseKey = "eventOrganizers";
export const eventOrganizersKey = ({ eventId, type }: EventUsersInput) => [
  eventOrganizersBaseKey,
  eventId,
  ...(type === "summary" ? ["summary"] : []),
];
export const eventAttendeesBaseKey = "eventAttendees";
export const eventAttendeesKey = ({ eventId, type }: EventUsersInput) => [
  eventAttendeesBaseKey,
  eventId,
  { type },
];

export const discussionKey = (discussionId: number) => [
  "discussion",
  discussionId,
];
export const threadKey = (threadId: number) => ["thread", threadId];

// messaging
export const groupChatsListKey = (filters?: { onlyArchived?: boolean }) =>
  filters ? ["groupChatsList", filters] : ["groupChatsList"];
export const groupChatKey = (groupChatId: number) => ["groupChat", groupChatId];
export const groupChatMessagesKey = (groupChatId: number) => [
  "groupChatMessages",
  groupChatId,
];
export const hostRequestsListKey = (filters?: {
  onlyActive?: boolean;
  onlyArchived?: boolean;
  type?: "all" | "hosting" | "surfing";
}) => (filters ? ["hostRequests", filters] : ["hostRequests"]);
export const hostRequestKey = (id?: number) => ["hostRequest", id];
export const hostRequestMessagesKey = (id?: number) => [
  "hostRequestMessages",
  id,
];

// User
export const userCommunitiesKey = "userCommunities";
export const userCommunitiesListKey = "userCommunitiesList";
export const myEventsKey = (type: EventsType) => ["myEvents", { type }];
export const myCommunityEventsKey = (type: EventsType) => [
  "myCommunityEvents",
  { type },
];
export const activeLoginsKey = "activeLogins";
export const inviteCodesKey = "inviteCodes";
export const remindersKey = "reminders";

// Badges
interface BadgeUsersInput {
  badgeId: string;
}
export const badgeUsersKey = ({ badgeId }: BadgeUsersInput) => [
  "badgeUsers",
  badgeId,
];

// mod
export const newUsersListKey = "newUsersList";

// Public
export const volunteersKey = "volunteers";
export const donationStatsKey = "donationStats";

// Translate
export const showAllLanguagesQueryKey = "showAllLanguages";

// Gallery
export const galleryKey = (galleryId: number) => ["gallery", galleryId];
export const galleryEditInfoKey = (galleryId: number) => [
  "galleryEditInfo",
  galleryId,
];
