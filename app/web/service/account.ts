import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import {
  BoolValue,
  StringValue,
} from "google-protobuf/google/protobuf/wrappers_pb";
import {
  ChangeEmailV2Req,
  ChangeLanguagePreferenceReq,
  ChangePasswordV2Req,
  ChangePhoneReq,
  CreateInviteCodeReq,
  DeleteAccountReq,
  DisableInviteCodeReq,
  FillContributorFormReq,
  ImportFromCouchsurfingComReq,
  ListActiveSessionsReq,
  LogOutOtherSessionsReq,
  LogOutSessionReq,
  ProfilePublicVisibility,
  SetProfilePublicVisibilityReq,
  UpdateMyVolunteerInfoReq,
  VerifyPhoneReq,
} from "proto/account_pb";
import {
  CompletePasswordResetV2Req,
  ConfirmChangeEmailV2Req,
  ContributorForm as ContributorFormPb,
  ResetPasswordReq,
} from "proto/auth_pb";

import { contributorFormFromObject } from "./auth";
import client from "./client";

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
  newPassword: string,
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

export function changeLanguage(newLanguage: string) {
  // make a ChangeLanguage request
  const req = new ChangeLanguagePreferenceReq();
  // set the new request language to newLanguage
  req.setUiLanguagePreference(newLanguage);
  // return the response
  return client.account.changeLanguagePreference(req);
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
      contributorFormFromObject(form),
    ),
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

export async function listActiveSessions(pageToken?: string) {
  const req = new ListActiveSessionsReq();
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  const response = await client.account.listActiveSessions(req);
  return response.toObject();
}

export async function logOutOtherSessions(confirm: boolean) {
  const req = new LogOutOtherSessionsReq();
  req.setConfirm(confirm);
  const response = await client.account.logOutOtherSessions(req);
  return response.toObject();
}

export async function logOutSession(created: Timestamp.AsObject) {
  const req = new LogOutSessionReq();
  const ts = new Timestamp();
  ts.setSeconds(created.seconds);
  ts.setNanos(created.nanos);
  req.setCreated(ts);
  const response = await client.account.logOutSession(req);
  return response.toObject();
}

export async function initiateStrongVerification() {
  const res = await client.account.initiateStrongVerification(new Empty());
  return res.toObject();
}

export async function deleteStrongVerificationData() {
  await client.account.deleteStrongVerificationData(new Empty());
}

export function setProfilePublicVisibility(setting: ProfilePublicVisibility) {
  const req = new SetProfilePublicVisibilityReq();
  req.setProfilePublicVisibility(setting);
  return client.account.setProfilePublicVisibility(req);
}

export type UpdateVolunteerInfoParams = {
  [k in keyof UpdateMyVolunteerInfoReq.AsObject]: Required<UpdateMyVolunteerInfoReq.AsObject>[k]["value"];
};

export function updateVolunteerInfo(info: UpdateVolunteerInfoParams) {
  const req = new UpdateMyVolunteerInfoReq();

  if (info.showOnTeamPage !== undefined) {
    req.setShowOnTeamPage(new BoolValue().setValue(info.showOnTeamPage));
  }

  if (info.displayName !== undefined) {
    req.setDisplayName(new StringValue().setValue(info.displayName));
  }

  if (info.displayLocation !== undefined) {
    req.setDisplayLocation(new StringValue().setValue(info.displayLocation));
  }

  if (info.linkType) {
    req.setLinkType(new StringValue().setValue(info.linkType));
  }

  if (info.linkUrl) {
    req.setLinkUrl(new StringValue().setValue(info.linkUrl));
  }

  if (info.linkText) {
    req.setLinkText(new StringValue().setValue(info.linkText));
  }

  return client.account.updateMyVolunteerInfo(req);
}

export async function getMyVolunteerInfo() {
  return (await client.account.getMyVolunteerInfo(new Empty())).toObject();
}

export async function getReminders() {
  return (await client.account.getReminders(new Empty())).toObject();
}

export async function createInviteCode() {
  const res = await client.account.createInviteCode(new CreateInviteCodeReq());
  return res.toObject();
}

export async function disableInviteCode(code: string) {
  const req = new DisableInviteCodeReq();
  req.setCode(code);
  await client.account.disableInviteCode(req);
}

export async function listInviteCodes() {
  const res = await client.account.listInviteCodes(new Empty());
  return res.toObject();
}

export async function importFromCouchsurfingCom(
  jsonData: string,
  overwriteExisting: boolean,
) {
  const req = new ImportFromCouchsurfingComReq();
  req.setCouchsurfingcomJson(jsonData);
  req.setOverwriteExisting(overwriteExisting);
  const res = await client.account.importFromCouchsurfingCom(req);
  return res.toObject();
}
