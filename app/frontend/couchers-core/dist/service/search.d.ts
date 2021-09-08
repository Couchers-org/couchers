import { HostingStatus } from "proto/api_pb";
export interface UserSearchFilters {
    query?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    lastActive?: number;
    hostingStatusOptions?: HostingStatus[];
    numGuests?: number;
}
export declare function userSearch({ query, lat, lng, radius, lastActive, hostingStatusOptions, numGuests, }: UserSearchFilters, pageToken?: string): Promise<import("proto/search_pb").UserSearchRes.AsObject>;
//# sourceMappingURL=search.d.ts.map