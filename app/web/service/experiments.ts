import { EvaluateFeatureFlagReq } from "proto/bugs_pb";

import client from "./client";

/**
 * Remotely evaluate a single feature flag for the current session's user (anonymously when logged
 * out). Evaluated server-side one flag at a time, on demand, so the backend only evaluates flags
 * the client actually uses - which keeps exposure logging accurate. Returns undefined when the flag
 * isn't configured server-side, so the caller's in-code default applies.
 */
export async function evaluateFlag(flagKey: string): Promise<unknown> {
  const req = new EvaluateFeatureFlagReq();
  req.setFlagKey(flagKey);
  const res = await client.bugs.evaluateFeatureFlag(req);
  const value = res.getValue();
  return value ? value.toJavaScript() : undefined;
}
