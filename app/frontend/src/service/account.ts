import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { StringValue } from "google-protobuf/google/protobuf/wrappers_pb";
import { ChangeEmailReq, ChangePasswordReq } from "pb/account_pb";
import {
  CompleteChangeEmailReq,
  CompletePasswordResetReq,
  ResetPasswordReq,
} from "pb/auth_pb";
import client from "service/client";

export async function getAccountInfo() {
  const res = await client.account.getAccountInfo(new Empty());
  return res.toObject();
}

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

export function changeEmail(newEmail: string, currentPassword?: string) {
  const req = new ChangeEmailReq();
  req.setNewEmail(newEmail);
  if (currentPassword) {
    req.setPassword(new StringValue().setValue(currentPassword));
  }

  return client.account.changeEmail(req);
}

export function completeChangeEmail(resetToken: string) {
  const req = new CompleteChangeEmailReq();
  req.setChangeEmailToken(resetToken);
  return client.auth.completeChangeEmail(req);
}
