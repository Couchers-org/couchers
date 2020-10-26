import { authClient } from "../../api";
import { LoginReq } from "../../../pb/auth_pb";

export const checkUsername = async (username: string) => {
  const req = new LoginReq();
  req.setUser(username);
  const res = await authClient.login(req);
  return res.getNextStep();
};
