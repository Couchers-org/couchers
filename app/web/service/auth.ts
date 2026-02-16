import { BoolValue } from "google-protobuf/google/protobuf/wrappers_pb";
import { HostingStatus } from "proto/api_pb";
import {
  AntiBotReq,
  ConfirmDeleteAccountReq,
  ContributorForm as ContributorFormPb,
  GetInviteCodeInfoReq,
  RecoverAccountReq,
  SignupAccount,
  SignupBasic,
  SignupFlowReq,
  SignupIntents,
  UnsubscribeReq,
  UsernameValidReq,
} from "proto/auth_pb";

import client from "./client";

export async function startSignup(
  name: string,
  email: string,
  inviteCode?: string,
) {
  const req = new SignupFlowReq();
  const basic = new SignupBasic();

  if (inviteCode) {
    basic.setInviteCode(inviteCode);
  }

  basic.setName(name);
  basic.setEmail(email);

  req.setBasic(basic);
  const res = await client.auth.signupFlow(req);
  return res.toObject();
}

export async function getInviteCodeInfo(code: string) {
  const req = new GetInviteCodeInfoReq();
  req.setCode(code);
  const res = await client.auth.getInviteCodeInfo(req);
  return res.toObject();
}

interface AccountSignupData {
  flowToken: string;
  username: string;
  password?: string;
  birthdate: string;
  gender: string;
  acceptTOS: boolean;
  optOutOfNewsletter: boolean;
  hostingStatus: HostingStatus;
  city: string;
  lat: number;
  lng: number;
  radius: number;
}

export async function signupFlowAccount({
  flowToken,
  username,
  password,
  birthdate,
  gender,
  acceptTOS,
  optOutOfNewsletter,
  hostingStatus,
  city,
  lat,
  lng,
  radius,
}: AccountSignupData) {
  const req = new SignupFlowReq();
  req.setFlowToken(flowToken);
  const account = new SignupAccount();
  account.setUsername(username);
  account.setBirthdate(birthdate);
  account.setGender(gender);
  account.setAcceptTos(acceptTOS);
  account.setOptOutOfNewsletter(optOutOfNewsletter);
  account.setHostingStatus(hostingStatus);
  account.setCity(city);
  account.setLat(lat);
  account.setLng(lng);
  account.setRadius(radius);
  if (password) {
    account.setPassword(password);
  }
  req.setAccount(account);
  const res = await client.auth.signupFlow(req);
  return res.toObject();
}

export function contributorFormFromObject(form: ContributorFormPb.AsObject) {
  const formData = new ContributorFormPb();
  formData
    .setIdeas(form.ideas)
    .setFeatures(form.features)
    .setExperience(form.experience)
    .setContribute(form.contribute)
    .setContributeWaysList(form.contributeWaysList)
    .setExpertise(form.expertise);
  return formData;
}

export async function signupFlowFeedback(
  flowToken: string,
  form: ContributorFormPb.AsObject,
) {
  const req = new SignupFlowReq();
  req.setFlowToken(flowToken);
  const formData = contributorFormFromObject(form);
  req.setFeedback(formData);
  const res = await client.auth.signupFlow(req);
  return res.toObject();
}

export async function signupFlowEmailToken(emailToken: string) {
  const req = new SignupFlowReq();
  req.setEmailToken(emailToken);
  const res = await client.auth.signupFlow(req);
  return res.toObject();
}

export async function signupFlowIntents(
  flowToken: string,
  intents: string[],
) {
  const req = new SignupFlowReq();
  req.setFlowToken(flowToken);
  const signupIntents = new SignupIntents();
  signupIntents.setIntentsList(intents);
  req.setIntents(signupIntents);
  const res = await client.auth.signupFlow(req);
  return res.toObject();
}

export async function signupFlowCommunityGuidelines(
  flowToken: string,
  accept: boolean,
) {
  const req = new SignupFlowReq();
  req.setFlowToken(flowToken);
  req.setAcceptCommunityGuidelines(new BoolValue().setValue(accept));
  const res = await client.auth.signupFlow(req);
  return res.toObject();
}

export async function signupFlowResendVerificationEmail(flowToken: string) {
  const req = new SignupFlowReq();
  req.setFlowToken(flowToken);
  req.setResendVerificationEmail(true);
  const res = await client.auth.signupFlow(req);
  return res.toObject();
}

export async function validateUsername(username: string) {
  const req = new UsernameValidReq();
  req.setUsername(username);
  const res = await client.auth.usernameValid(req);
  return res.getValid();
}

export async function unsubscribe(payload: string, sig: string) {
  const req = new UnsubscribeReq();
  req.setPayload(payload);
  req.setSig(sig);
  const res = await client.auth.unsubscribe(req);
  return res.toObject();
}

export async function confirmDeleteAccount(token: string) {
  const req = new ConfirmDeleteAccountReq();
  req.setToken(token);
  await client.auth.confirmDeleteAccount(req);
}

export async function recoverAccount(token: string) {
  const req = new RecoverAccountReq();
  req.setToken(token);
  await client.auth.recoverAccount(req);
}

export async function antibot(token: string, action: string) {
  const req = new AntiBotReq();
  req.setToken(token);
  req.setAction(action);
  return await client.auth.antiBot(req);
}
