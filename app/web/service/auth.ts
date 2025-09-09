import { BoolValue } from "google-protobuf/google/protobuf/wrappers_pb";

import { HostingStatus } from "@/proto/api_pb";
import {
  AntiBotReq,
  ConfirmDeleteAccountReq,
  ContributorForm as ContributorFormPb,
  RecoverAccountReq,
  SignupAccount,
  SignupBasic,
  SignupFlowReq,
  UnsubscribeReq,
  UsernameValidReq,
} from "@/proto/auth_pb";

import client from "./client";

export const startSignup = async (name: string, email: string) => {
  const req = new SignupFlowReq();
  const basic = new SignupBasic();
  basic.setName(name);
  basic.setEmail(email);
  req.setBasic(basic);
  const res = await client.auth.signupFlow(req);
  return res.toObject();
};

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

export const signupFlowAccount = async ({
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
}: AccountSignupData) => {
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
};

export const contributorFormFromObject = (form: ContributorFormPb.AsObject) => {
  const formData = new ContributorFormPb();
  formData
    .setIdeas(form.ideas)
    .setFeatures(form.features)
    .setExperience(form.experience)
    .setContribute(form.contribute)
    .setContributeWaysList(form.contributeWaysList)
    .setExpertise(form.expertise);
  return formData;
};

export const signupFlowFeedback = async (
  flowToken: string,
  form: ContributorFormPb.AsObject,
) => {
  const req = new SignupFlowReq();
  req.setFlowToken(flowToken);
  const formData = contributorFormFromObject(form);
  req.setFeedback(formData);
  const res = await client.auth.signupFlow(req);
  return res.toObject();
};

export const signupFlowEmailToken = async (emailToken: string) => {
  const req = new SignupFlowReq();
  req.setEmailToken(emailToken);
  const res = await client.auth.signupFlow(req);
  return res.toObject();
};

export const signupFlowCommunityGuidelines = async (
  flowToken: string,
  accept: boolean,
) => {
  const req = new SignupFlowReq();
  req.setFlowToken(flowToken);
  req.setAcceptCommunityGuidelines(new BoolValue().setValue(accept));
  const res = await client.auth.signupFlow(req);
  return res.toObject();
};

export const signupFlowResendVerificationEmail = async (flowToken: string) => {
  const req = new SignupFlowReq();
  req.setFlowToken(flowToken);
  req.setResendVerificationEmail(true);
  const res = await client.auth.signupFlow(req);
  return res.toObject();
};

export const validateUsername = async (username: string) => {
  const req = new UsernameValidReq();
  req.setUsername(username);
  const res = await client.auth.usernameValid(req);
  return res.getValid();
};

export const unsubscribe = async (payload: string, sig: string) => {
  const req = new UnsubscribeReq();
  req.setPayload(payload);
  req.setSig(sig);
  const res = await client.auth.unsubscribe(req);
  return res.toObject();
};

export const confirmDeleteAccount = async (token: string) => {
  const req = new ConfirmDeleteAccountReq();
  req.setToken(token);
  await client.auth.confirmDeleteAccount(req);
};

export const recoverAccount = async (token: string) => {
  const req = new RecoverAccountReq();
  req.setToken(token);
  await client.auth.recoverAccount(req);
};

export const antibot = async (token: string, action: string) => {
  const req = new AntiBotReq();
  req.setToken(token);
  req.setAction(action);
  return await client.auth.antiBot(req);
};
