import { ReferenceType } from "proto/references_pb";
export declare enum ReferenceTypeStrings {
    "friend" = 0,
    "surfed" = 1,
    "hosted" = 2
}
export declare type ReferenceTypeState = ReferenceType | "all" | "given";
interface GetReferencesBaseInput {
    userId: number;
    pageToken?: string;
}
interface GetAvailableReferencesInput {
    userId: number;
}
interface WriteReferenceBaseInput {
    text: string;
    wasAppropriate: boolean;
    rating: number;
}
export interface WriteHostRequestReferenceInput extends WriteReferenceBaseInput {
    hostRequestId: number;
}
export interface WriteFriendReferenceInput extends WriteReferenceBaseInput {
    toUserId: number;
}
declare type GetReferencesGivenInput = GetReferencesBaseInput;
export declare function getReferencesGivenByUser({ userId, pageToken, }: GetReferencesGivenInput): Promise<import("proto/references_pb").ListReferencesRes.AsObject>;
interface GetReferencesReceivedInput extends GetReferencesBaseInput {
    referenceType: Exclude<ReferenceTypeState, "given">;
}
export declare function getReferencesReceivedForUser({ userId, pageToken, referenceType, }: GetReferencesReceivedInput): Promise<import("proto/references_pb").ListReferencesRes.AsObject>;
export declare function getAvailableReferences({ userId, }: GetAvailableReferencesInput): Promise<import("proto/references_pb").AvailableWriteReferencesRes.AsObject>;
export declare function writeHostRequestReference({ hostRequestId, text, wasAppropriate, rating, }: WriteHostRequestReferenceInput): Promise<import("proto/references_pb").Reference.AsObject>;
export declare function writeFriendRequestReference({ toUserId, text, wasAppropriate, rating, }: WriteFriendReferenceInput): Promise<import("proto/references_pb").Reference.AsObject>;
export {};
//# sourceMappingURL=references.d.ts.map