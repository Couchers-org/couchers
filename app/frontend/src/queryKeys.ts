import { ReferenceType } from "proto/references_pb";

// profiles/users
export const languagesKey = "languages";
export const regionsKey = "regions";
export const contributorFormInfoQueryKey = "contributorFormInfo";
export const accountInfoQueryKey = "accountInfo";
export const tosQueryKey = "tos";

export const referencesGivenKey = (userId: number) => [
  "referencesGiven",
  { userId },
];

export const referencesReceivedBaseKey = "referencesReceived";
export interface ReferencesReceivedKeyInputs {
  userId: number;
  type: ReferenceType | "all";
}
export const referencesReceivedKey = ({
  userId,
  type,
}: ReferencesReceivedKeyInputs) => [
  referencesReceivedBaseKey,
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

export type CommunityAdminsQueryType = "summary" | "all";
export const communityAdminsKey = (
  communityId: number,
  type: CommunityAdminsQueryType
) => ["communityAdmins", { communityId, type }];

export const communityMembersKey = (communityId: number) => [
  "communityMembers",
  communityId,
];
export const communityNearbyUsersKey = (communityId: number) => [
  "communityNearbyUsers",
  communityId,
];

export const communityEventsKey = (communityId: number) => [
  "communityEvents",
  communityId,
];

export const discussionKey = (discussionId: number) => [
  "discussion",
  discussionId,
];
export const threadKey = (threadId: number) => ["thread", threadId];

// messaging
export const groupChatsListKey = "groupChatsList";
export const groupChatKey = (groupChatId: number) => ["groupChat", groupChatId];
export const groupChatMessagesKey = (groupChatId: number) => [
  "groupChatMessages",
  groupChatId,
];

// Search
export const searchQueryKey = (query?: string) =>
  query ? ["search", query] : ["search"];

// User
export const userCommunitiesKey = "userCommunities";
