export interface ReportInput {
    reason: string;
    description: string;
    contentRef: string;
    authorUser: string | number;
}
export declare function reportContent({ reason, description, contentRef, authorUser, }: ReportInput): Promise<import("google-protobuf/google/protobuf/empty_pb").Empty>;
//# sourceMappingURL=reporting.d.ts.map