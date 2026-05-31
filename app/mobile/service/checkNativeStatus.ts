import { CheckNativeStatusReq } from "@/proto/bugs_pb";
import client from "@/service/client";

// JSON-encodes a diagnostics snapshot into debug_json and returns the backend's update decision.
export async function checkNativeStatus(debugInfo: Record<string, unknown>) {
  const req = new CheckNativeStatusReq();
  req.setDebugJson(JSON.stringify(debugInfo));

  const res = await client.bugs.checkNativeStatus(req);
  return res.toObject();
}
