import {
  LoginReq,
  SignupReq,
  SignupTokenInfoReq,
  UsernameValidReq,
} from "../pb/auth_pb";
import client from "./api";

const serviceMap = {
  checkUsername: async (username: string) => {
    const req = new LoginReq();
    req.setUser(username);
    const res = await client.auth.login(req);
    return res.getNextStep();
  },

  createEmailSignup: async (email: string) => {
    const req = new SignupReq();
    req.setEmail(email);
    const res = await client.auth.signup(req);
    return res.getNextStep();
  },

  getSignupEmail: async (signupToken: string) => {
    const req = new SignupTokenInfoReq();
    req.setSignupToken(signupToken);
    const res = await client.auth.signupTokenInfo(req);
    return res.getEmail();
  },

  validateUsername: async (username: string) => {
    const req = new UsernameValidReq();
    req.setUsername(username);
    const res = await client.auth.usernameValid(req);
    return res.getValid();
  },
};

export default serviceMap;
