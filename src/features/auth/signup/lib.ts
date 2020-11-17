import { client } from "../../api";
import {
  SignupReq,
  SignupTokenInfoReq,
  UsernameValidReq,
} from "../../../pb/auth_pb";

export const createEmailSignup = async (email: string) => {
  const req = new SignupReq();
  req.setEmail(email);
  const res = await client.auth.signup(req);
  return res.getNextStep();
};

export const getSignupEmail = async (signupToken: string) => {
  const req = new SignupTokenInfoReq();
  req.setSignupToken(signupToken);
  const res = await client.auth.signupTokenInfo(req);
  return res.getEmail();
};

export const validateUsername = async (username: string) => {
  const req = new UsernameValidReq();
  req.setUsername(username);
  const res = await client.auth.usernameValid(req);
  return res.getValid();
};
