import { LoginReq } from "../../pb/auth_pb";
import { authClient } from "../api";

export const checkUsername = async (username: string) => {
  const req = new LoginReq();
  req.setUser(username);
  const res = await authClient.login(req);
  return res.getNextStep();
};
