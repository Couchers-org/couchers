import { isActionable, updateMode } from "@/features/diagnostics/updateDecision";
import { NativeUpdateAction } from "@/proto/bugs_pb";
import { NativeUpdateInfo } from "@/service/checkNativeStatus";

function info(overrides: Partial<NativeUpdateInfo> = {}): NativeUpdateInfo {
  return {
    action: NativeUpdateAction.NATIVE_UPDATE_ACTION_OTA,
    required: false,
    nagIntervalSeconds: 0,
    message: "",
    linkUrl: "",
    linkText: "",
    ...overrides,
  };
}

const now = new Date("2026-05-30T12:00:00.000Z");

describe("isActionable", () => {
  it("is false for NONE and UNSPECIFIED", () => {
    expect(
      isActionable(info({ action: NativeUpdateAction.NATIVE_UPDATE_ACTION_NONE })),
    ).toBe(false);
    expect(
      isActionable(
        info({ action: NativeUpdateAction.NATIVE_UPDATE_ACTION_UNSPECIFIED }),
      ),
    ).toBe(false);
  });

  it("is true for OTA, STORE, and REINSTALL", () => {
    for (const action of [
      NativeUpdateAction.NATIVE_UPDATE_ACTION_OTA,
      NativeUpdateAction.NATIVE_UPDATE_ACTION_STORE,
      NativeUpdateAction.NATIVE_UPDATE_ACTION_REINSTALL,
    ]) {
      expect(isActionable(info({ action }))).toBe(true);
    }
  });
});

describe("updateMode", () => {
  it("is nag when not required", () => {
    expect(updateMode(info({ required: false }), now)).toBe("nag");
  });

  it("is block when required with no deadline", () => {
    expect(updateMode(info({ required: true }), now)).toBe("block");
  });

  it("is block when required and the deadline has passed", () => {
    const actBy = new Date(now.getTime() - 1000);
    expect(updateMode(info({ required: true, actBy }), now)).toBe("block");
  });

  it("is warn when required and the deadline is still in the future", () => {
    const actBy = new Date(now.getTime() + 60_000);
    expect(updateMode(info({ required: true, actBy }), now)).toBe("warn");
  });
});
