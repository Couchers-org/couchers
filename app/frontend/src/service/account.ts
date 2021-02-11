import { CompletePasswordResetReq, ResetPasswordReq } from "../pb/auth_pb";
import client from "./client";

export function resetPassword(userId: string) {
  const req = new ResetPasswordReq();
  req.setUser(userId);
  return client.auth.resetPassword(req);
}

export function completePasswordReset(resetToken: string) {
  const req = new CompletePasswordResetReq();
  req.setPasswordResetToken(resetToken);
  return client.auth.completePasswordReset(req);
}
