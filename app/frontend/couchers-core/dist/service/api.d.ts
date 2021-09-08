import { Empty } from "google-protobuf/google/protobuf/empty_pb";
export declare function cancelFriendRequest(friendRequestId: number): Promise<Empty>;
export declare function listFriends(): Promise<number[]>;
export declare function listFriendRequests(): Promise<import("proto/api_pb").ListFriendRequestsRes.AsObject>;
export declare function respondFriendRequest(friendRequestId: number, accept: boolean): Promise<Empty>;
export declare function sendFriendRequest(userId: number): Promise<Empty>;
export declare function ping(): Promise<import("proto/api_pb").PingRes.AsObject>;
export interface ImageInputValues {
    file: File;
    filename: string;
    key: string;
    thumbnail_url: string;
    full_url: string;
}
export declare function uploadFile(file: File): Promise<ImageInputValues>;
//# sourceMappingURL=api.d.ts.map