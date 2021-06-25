import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { StringValue } from "google-protobuf/google/protobuf/wrappers_pb";
import {
  ChangeEmailReq,
  ChangePasswordReq,
  MarkContributorFormFilledReq,
} from "proto/account_pb";
import {
  CompletePasswordResetReq,
  ConfirmChangeEmailReq,
  ResetPasswordReq,
} from "proto/auth_pb";
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

export async function confirmChangeEmail(resetToken: string) {
  const req = new ConfirmChangeEmailReq();
  req.setChangeEmailToken(resetToken);
  return (await client.auth.confirmChangeEmail(req)).toObject();
}

export async function getContributorFormInfo() {
  const res = await client.account.getContributorFormInfo(new Empty());
  return res.toObject();
}

export async function markContributorFormFilled() {
  const req = new MarkContributorFormFilledReq();
  req.setFilledContributorForm(true);
  await client.account.markContributorFormFilled(req);
}
