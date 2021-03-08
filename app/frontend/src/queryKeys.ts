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

export const threadKey = (threadId: number) => ["thread", threadId];

export const referencesKey = (
  userId: number,
  type: "received" | "given" | "all"
) => ["references", { type, userId }];
