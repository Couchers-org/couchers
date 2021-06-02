import { ReferenceType } from "pb/references_pb";

export const languagesKey = "languages";
export const regionsKey = "regions";

export const contributorFormInfoQueryKey = "contributorFormInfo";

export const accountInfoQueryKey = "accountInfo";

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
export const communityAdminsKey = (communityId: number) => [
  "communityAdmins",
  communityId,
];
export const communityMembersKey = (communityId: number) => [
  "communityMembers",
  communityId,
];
export const communityNearbyUsersKey = (communityId: number) => [
  "communityNearbyUsers",
  communityId,
];

export const discussionKey = (discussionId: number) => [
  "discussion",
  discussionId,
];

export const threadKey = (threadId: number) => ["thread", threadId];

export const referencesGivenKey = (userId: number) => [
  "referencesGiven",
  { userId },
];
export const referencesReceivedKey = (
  userId: number,
  type: ReferenceType | "all"
) => ["referencesReceived", { type, userId }];

export const referencesKey = (
  userId: number,
  type: "received" | "given" | "all"
) => ["references", { type, userId }];

export type FriendRequestType = "sent" | "received";
export const friendRequestKey = (type: FriendRequestType) => [
  "friendRequests",
  { type },
];

// Group chats
export const groupChatsListKey = "groupChatsList";
export const groupChatKey = (groupChatId: number) => ["groupChat", groupChatId];
export const groupChatMessagesKey = (groupChatId: number) => [
  "groupChatMessages",
  groupChatId,
];

// Search
export const searchQueryKey = (query?: string) =>
  query ? ["search", query] : ["search"];

export const tosQueryKey = "tos";
