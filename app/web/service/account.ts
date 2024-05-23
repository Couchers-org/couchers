import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { StringValue } from "google-protobuf/google/protobuf/wrappers_pb";
import {
  ChangeEmailReq,
  ChangePasswordReq,
  ChangePhoneReq,
  DeleteAccountReq,
  FillContributorFormReq,
  SetDoNotEmailReq,
  VerifyPhoneReq,
} from "proto/account_pb";
import {
  CompletePasswordResetReq,
  ConfirmChangeEmailReq,
  ContributorForm as ContributorFormPb,
  ResetPasswordReq,
} from "proto/auth_pb";
import client from "service/client";

import { contributorFormFromObject } from "./auth";

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

export function setDoNotEmail(newValue: boolean) {
  const req = new SetDoNotEmailReq();
  req.setDoNotEmail(newValue);
  return client.account.setDoNotEmail(req);
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

export async function fillContributorForm(form: ContributorFormPb.AsObject) {
  const res = await client.account.fillContributorForm(
    new FillContributorFormReq().setContributorForm(
      contributorFormFromObject(form)
    )
  );
  return res.toObject();
}

export function deleteAccount(confirm: boolean, reason?: string) {
  const req = new DeleteAccountReq();
  req.setConfirm(confirm);
  if (reason) {
    req.setReason(reason);
  }
  return client.account.deleteAccount(req);
}
export function changePhone(phone: string) {
  const req = new ChangePhoneReq();
  req.setPhone(phone);
  return client.account.changePhone(req);
}

export function removePhone() {
  const req = new ChangePhoneReq();
  req.setPhone("");
  return client.account.changePhone(req);
}

export function verifyPhone(code: string) {
  const req = new VerifyPhoneReq();
  req.setToken(code);
  return client.account.verifyPhone(req);
}
