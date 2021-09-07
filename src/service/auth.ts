import { BoolValue } from "google-protobuf/google/protobuf/wrappers_pb";
import { HostingStatus } from "proto/api_pb";
import {
  ContributorForm as ContributorFormPb,
  LoginReq,
  SignupAccount,
  SignupBasic,
  SignupFlowReq,
  UsernameValidReq,
} from "proto/auth_pb";
import client from "service/client";

export async function checkUsername(username: string) {
  const req = new LoginReq();
  req.setUser(username);
  const res = await client.auth.login(req);
  return res.getNextStep();
}

export async function startSignup(name: string, email: string) {
  const req = new SignupFlowReq();
  const basic = new SignupBasic();
  basic.setName(name);
  basic.setEmail(email);
  req.setBasic(basic);
  const res = await client.auth.signupFlow(req);
  return res.toObject();
}

interface AccountSignupData {
  flowToken: string;
  username: string;
  password?: string;
  birthdate: string;
  gender: string;
  acceptTOS: boolean;
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
  form: ContributorFormPb.AsObject
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

export async function signupFlowCommunityGuidelines(
  flowToken: string,
  accept: boolean
) {
  const req = new SignupFlowReq();
  req.setFlowToken(flowToken);
  req.setAcceptCommunityGuidelines(new BoolValue().setValue(accept));
  const res = await client.auth.signupFlow(req);
  return res.toObject();
}

export async function validateUsername(username: string) {
  const req = new UsernameValidReq();
  req.setUsername(username);
  const res = await client.auth.usernameValid(req);
  return res.getValid();
}
