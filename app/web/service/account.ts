import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";

import {
  ChangeEmailV2Req,
  ChangeLanguagePreferenceReq,
  ChangePasswordV2Req,
  ChangePhoneReq,
  DeleteAccountReq,
  FillContributorFormReq,
  ListActiveSessionsReq,
  LogOutOtherSessionsReq,
  LogOutSessionReq,
  ProfilePublicVisibility,
  SetProfilePublicVisibilityReq,
  VerifyPhoneReq,
} from "@/proto/account_pb";
import {
  CompletePasswordResetV2Req,
  ConfirmChangeEmailV2Req,
  ContributorForm as ContributorFormPb,
  ResetPasswordReq,
} from "@/proto/auth_pb";

import { contributorFormFromObject } from "./auth";
import client from "./client";

export const getAccountInfo = async () => {
  const res = await client.account.getAccountInfo(new Empty());
  return res.toObject();
};

export const resetPassword = (userId: string) => {
  const req = new ResetPasswordReq();
  req.setUser(userId);
  return client.auth.resetPassword(req);
};

export const completePasswordResetV2 = (
  resetToken: string,
  newPassword: string,
) => {
  const req = new CompletePasswordResetV2Req();
  req.setPasswordResetToken(resetToken);
  req.setNewPassword(newPassword);
  return client.auth.completePasswordResetV2(req);
};

export const changePassword = (oldPassword: string, newPassword: string) => {
  const req = new ChangePasswordV2Req();
  req.setOldPassword(oldPassword);
  req.setNewPassword(newPassword);
  return client.account.changePasswordV2(req);
};

export const changeEmail = (newEmail: string, currentPassword: string) => {
  const req = new ChangeEmailV2Req();
  req.setNewEmail(newEmail);
  req.setPassword(currentPassword);
  return client.account.changeEmailV2(req);
};

export const changeLanguage = (newLanguage: string) => {
  const req = new ChangeLanguagePreferenceReq();
  req.setUiLanguagePreference(newLanguage);
  return client.account.changeLanguagePreference(req);
};

export const confirmChangeEmail = async (resetToken: string) => {
  const req = new ConfirmChangeEmailV2Req();
  req.setChangeEmailToken(resetToken);
  return client.auth.confirmChangeEmailV2(req);
};

export const getContributorFormInfo = async () => {
  const res = await client.account.getContributorFormInfo(new Empty());
  return res.toObject();
};

export const fillContributorForm = async (form: ContributorFormPb.AsObject) => {
  const res = await client.account.fillContributorForm(
    new FillContributorFormReq().setContributorForm(
      contributorFormFromObject(form),
    ),
  );
  return res.toObject();
};

export const deleteAccount = (confirm: boolean, reason?: string) => {
  const req = new DeleteAccountReq();
  req.setConfirm(confirm);
  if (reason) {
    req.setReason(reason);
  }
  return client.account.deleteAccount(req);
};

export const changePhone = (phone: string) => {
  const req = new ChangePhoneReq();
  req.setPhone(phone);
  return client.account.changePhone(req);
};

export const removePhone = () => {
  const req = new ChangePhoneReq();
  req.setPhone("");
  return client.account.changePhone(req);
};

export const verifyPhone = (code: string) => {
  const req = new VerifyPhoneReq();
  req.setToken(code);
  return client.account.verifyPhone(req);
};

export const listActiveSessions = async (pageToken?: string) => {
  const req = new ListActiveSessionsReq();
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  const response = await client.account.listActiveSessions(req);
  return response.toObject();
};

export const logOutOtherSessions = async (confirm: boolean) => {
  const req = new LogOutOtherSessionsReq();
  req.setConfirm(confirm);
  const response = await client.account.logOutOtherSessions(req);
  return response.toObject();
};

export const logOutSession = async (created: Timestamp.AsObject) => {
  const req = new LogOutSessionReq();
  const ts = new Timestamp();
  ts.setSeconds(created.seconds);
  ts.setNanos(created.nanos);
  req.setCreated(ts);
  const response = await client.account.logOutSession(req);
  return response.toObject();
};

export const initiateStrongVerification = async () => {
  const res = await client.account.initiateStrongVerification(new Empty());
  return res.toObject();
};

export const deleteStrongVerificationData = async () => {
  await client.account.deleteStrongVerificationData(new Empty());
};

export const setProfilePublicVisibility = (
  setting: ProfilePublicVisibility,
) => {
  const req = new SetProfilePublicVisibilityReq();
  req.setProfilePublicVisibility(setting);
  return client.account.setProfilePublicVisibility(req);
};
