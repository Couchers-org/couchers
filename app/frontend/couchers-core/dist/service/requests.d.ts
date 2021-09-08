import { Dayjs } from "dayjs";
import { HostRequestStatus } from "proto/conversations_pb";
import { CreateHostRequestReq } from "proto/requests_pb";
export declare function listHostRequests({ lastRequestId, count, type, onlyActive, }: {
    lastRequestId?: number;
    count?: number;
    type?: "all" | "hosting" | "surfing";
    onlyActive?: boolean;
}): Promise<import("proto/requests_pb").ListHostRequestsRes.AsObject>;
export declare function getHostRequest(id: number): Promise<import("proto/requests_pb").HostRequest.AsObject>;
export declare function sendHostRequestMessage(id: number, text: string): Promise<string | undefined>;
export declare function respondHostRequest(id: number, status: HostRequestStatus, text: string): Promise<void>;
export declare function getHostRequestMessages(id: number, lastMessageId?: number, count?: number): Promise<import("proto/requests_pb").GetHostRequestMessagesRes.AsObject>;
export declare type CreateHostRequestWrapper = Omit<Required<CreateHostRequestReq.AsObject>, "toDate" | "fromDate"> & {
    toDate: Dayjs;
    fromDate: Dayjs;
};
export declare function createHostRequest(data: CreateHostRequestWrapper): Promise<number>;
export declare function markLastRequestSeen(hostRequestId: number, messageId: number): Promise<import("google-protobuf/google/protobuf/empty_pb").Empty>;
//# sourceMappingURL=requests.d.ts.map