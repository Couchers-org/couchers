export declare function getCommunity(communityId: number): Promise<import("proto/communities_pb").Community.AsObject>;
/**
 * List sub-communities of a given community
 */
export declare function listCommunities(communityId: number, pageToken?: string): Promise<import("proto/communities_pb").ListCommunitiesRes.AsObject>;
export declare function listGroups(communityId: number, pageToken?: string): Promise<import("proto/communities_pb").ListGroupsRes.AsObject>;
export declare function listAdmins(communityId: number, pageToken?: string): Promise<import("proto/communities_pb").ListAdminsRes.AsObject>;
export declare function listMembers(communityId: number, pageToken?: string): Promise<import("proto/communities_pb").ListMembersRes.AsObject>;
export declare function listNearbyUsers(communityId: number, pageToken?: string): Promise<import("proto/communities_pb").ListNearbyUsersRes.AsObject>;
export declare function listPlaces(communityId: number, pageToken?: string): Promise<import("proto/communities_pb").ListPlacesRes.AsObject>;
export declare function listGuides(communityId: number, pageToken?: string): Promise<import("proto/communities_pb").ListGuidesRes.AsObject>;
export declare function listDiscussions(communityId: number, pageToken?: string): Promise<import("proto/communities_pb").ListDiscussionsRes.AsObject>;
export declare function joinCommunity(communityId: number): Promise<void>;
export declare function leaveCommunity(communityId: number): Promise<void>;
export declare function listUserCommunities(pageToken?: string): Promise<import("proto/communities_pb").ListUserCommunitiesRes.AsObject>;
//# sourceMappingURL=communities.d.ts.map