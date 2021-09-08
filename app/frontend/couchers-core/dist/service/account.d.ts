import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { ContributorForm as ContributorFormPb } from "proto/auth_pb";
export declare function getAccountInfo(): Promise<import("proto/account_pb").GetAccountInfoRes.AsObject>;
export declare function resetPassword(userId: string): Promise<Empty>;
export declare function completePasswordReset(resetToken: string): Promise<Empty>;
export declare function changePassword(oldPassword?: string, newPassword?: string): Promise<Empty>;
export declare function changeEmail(newEmail: string, currentPassword?: string): Promise<Empty>;
export declare function confirmChangeEmail(resetToken: string): Promise<import("proto/auth_pb").ConfirmChangeEmailRes.AsObject>;
export declare function getContributorFormInfo(): Promise<import("proto/account_pb").GetContributorFormInfoRes.AsObject>;
export declare function fillContributorForm(form: ContributorFormPb.AsObject): Promise<Empty.AsObject>;
//# sourceMappingURL=account.d.ts.map