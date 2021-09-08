export declare function getGroup(groupId: number): Promise<import("proto/groups_pb").Group.AsObject>;
export declare function listAdmins(groupId: number, pageToken?: string): Promise<import("proto/groups_pb").ListAdminsRes.AsObject>;
export declare function listMembers(groupId: number, pageToken?: string): Promise<import("proto/groups_pb").ListMembersRes.AsObject>;
export declare function listPlaces(groupId: number, pageToken?: string): Promise<import("proto/groups_pb").ListPlacesRes.AsObject>;
export declare function listGuides(groupId: number, pageToken?: string): Promise<import("proto/groups_pb").ListGuidesRes.AsObject>;
export declare function listDiscussions(groupId: number, pageToken?: string): Promise<import("proto/groups_pb").ListDiscussionsRes.AsObject>;
export declare function joinGroup(groupId: number): Promise<void>;
export declare function leaveGroup(groupId: number): Promise<void>;
//# sourceMappingURL=groups.d.ts.map