import { CheckNativeStatusReq, NativeUpdateAction } from "@/proto/bugs_pb";
import client from "@/service/client";

export interface NativeUpdateInfo {
  action: NativeUpdateAction;
  required: boolean;
  actBy?: Date;
  // Minimum seconds to wait before re-showing an advisory nag once dismissed.
  // 0 = show once per app session. Ignored when required.
  nagIntervalSeconds: number;
  message: string;
  linkUrl: string;
  linkText: string;
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
    nagIntervalSeconds: info?.getNagInterval()?.getSeconds() ?? 0,
    message: info?.getMessage() ?? "",
    linkUrl: info?.getLinkUrl() ?? "",
    linkText: info?.getLinkText() ?? "",
  };
}
