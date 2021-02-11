import { StringValue } from "google-protobuf/google/protobuf/wrappers_pb";

import { ChangePasswordReq } from "../pb/account_pb";
import { CompletePasswordResetReq, ResetPasswordReq } from "../pb/auth_pb";
import client from "./client";

export function resetPassword(userId: string) {
  const req = new ResetPasswordReq();
  req.setUser(userId);
  return client.auth.resetPassword(req);
}

export function completePasswordReset(resetToken: string) {
  const req = new CompletePasswordResetReq();
  req.setPasswordResetToken(resetToken);
  return client.auth.completePasswordReset(req);
}

export function changePassword(oldPassword?: string, newPassword?: string) {
  const req = new ChangePasswordReq();
  if (oldPassword) {
    req.setOldPassword(new StringValue().setValue(oldPassword));
  }
  if (newPassword) {
    req.setNewPassword(new StringValue().setValue(newPassword));
  }

  return client.account.changePassword(req);
}
