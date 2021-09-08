export interface BugReportFormData {
    subject: string;
    description: string;
    results: string;
}
export declare function reportBug({ description, results, subject, }: BugReportFormData): Promise<import("proto/bugs_pb").ReportBugRes.AsObject>;
//# sourceMappingURL=bugs.d.ts.map