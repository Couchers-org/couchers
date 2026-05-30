import { NativeUpdateAction } from "@/proto/bugs_pb";
import { NativeUpdateInfo } from "@/service/checkNativeStatus";

// How the prompt should present a given decision:
//   block — required & past its deadline (or no deadline): full-screen, non-dismissible.
//   warn  — required but deadline still in the future: dismissible, shows the deadline.
//   nag   — advisory (not required): dismissible, throttled by nag_interval.
export type UpdateMode = "block" | "warn" | "nag";

export interface UpdatePrompt {
  info: NativeUpdateInfo;
  mode: UpdateMode;
}

// Whether the backend is asking the user to do anything at all.
export function isActionable(info: NativeUpdateInfo): boolean {
  return (
    info.action !== NativeUpdateAction.NATIVE_UPDATE_ACTION_NONE &&
    info.action !== NativeUpdateAction.NATIVE_UPDATE_ACTION_UNSPECIFIED
  );
}

export function updateMode(info: NativeUpdateInfo, now: Date): UpdateMode {
  if (!info.required) return "nag";
  // Required: block once act_by has passed; an unset deadline blocks immediately.
  if (!info.actBy || info.actBy.getTime() <= now.getTime()) return "block";
  return "warn";
}
