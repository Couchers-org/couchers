import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import {
  ChangeEmailV2Req,
  ChangePasswordV2Req,
  ChangePhoneReq,
  DeleteAccountReq,
  FillContributorFormReq,
  ProfilePublicVisibilitySetting,
  SetProfilePublicVisibilityReq,
  VerifyPhoneReq,
} from "proto/account_pb";
import {
  CompletePasswordResetV2Req,
  ConfirmChangeEmailV2Req,
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

export function CompletePasswordResetV2(
  resetToken: string,
  newPassword: string
) {
  const req = new CompletePasswordResetV2Req();
  req.setPasswordResetToken(resetToken);
  req.setNewPassword(newPassword);

  return client.auth.completePasswordResetV2(req);
}

export function changePassword(oldPassword: string, newPassword: string) {
  const req = new ChangePasswordV2Req();
  req.setOldPassword(oldPassword);
  req.setNewPassword(newPassword);

  return client.account.changePasswordV2(req);
}

export function changeEmail(newEmail: string, currentPassword: string) {
  const req = new ChangeEmailV2Req();
  req.setNewEmail(newEmail);
  req.setPassword(currentPassword);

  return client.account.changeEmailV2(req);
}

export async function confirmChangeEmail(resetToken: string) {
  const req = new ConfirmChangeEmailV2Req();
  req.setChangeEmailToken(resetToken);
  return client.auth.confirmChangeEmailV2(req);
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

export function setProfilePublicVisibility(
  setting: ProfilePublicVisibilitySetting
) {
  const req = new SetProfilePublicVisibilityReq();
  req.setSetting(setting);
  return client.account.setProfilePublicVisibility(req);
}
