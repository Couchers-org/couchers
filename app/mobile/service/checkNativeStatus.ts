import { CheckNativeStatusReq, NativeUpdateAction } from "@/proto/bugs_pb";
import client from "@/service/client";

export interface NativeUpdateInfo {
  action: NativeUpdateAction;
  required: boolean;
  actBy?: Date;
  message: string;
  linkUrl: string;
}

// JSON-encodes a diagnostics snapshot into debug_json and returns the backend's update decision.
export async function checkNativeStatus(
  debugInfo: Record<string, unknown>,
): Promise<NativeUpdateInfo> {
  const req = new CheckNativeStatusReq();
  req.setDebugJson(JSON.stringify(debugInfo));

  const res = await client.bugs.checkNativeStatus(req);
  const info = res.getUpdateInfo();
  return {
    action: info?.getAction() ?? NativeUpdateAction.NATIVE_UPDATE_ACTION_NONE,
    required: info?.getRequired() ?? false,
    actBy: info?.getActBy()?.toDate(),
    message: info?.getMessage() ?? "",
    linkUrl: info?.getLinkUrl() ?? "",
  };
}
