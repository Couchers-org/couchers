import { NativeUpdateAction } from "couchers/proto/bugs_pb";
import {
  checkNativeStatus,
  NativeStatusPayload,
} from "@/service/checkNativeStatus";
import client from "@/service/client";

jest.mock("@/service/client", () => ({
  bugs: {
    checkNativeStatus: jest.fn(),
  },
}));

const mockCheckNativeStatus = client.bugs.checkNativeStatus as jest.Mock;

function mockResponse(asObject: unknown) {
  return { toObject: () => asObject };
}

function basePayload(): NativeStatusPayload {
  return {
    easClientId: "00000000-0000-0000-0000-000000000001",
    installId: "install-1",
    platform: "ios",
    osVersion: "17.4",
    locale: "en",
    userState: "authenticated",
    appVariant: "production",
    appVersion: "1.1.20",
    nativeBuild: "42",
    embeddedDisplayVersion: "v1.1",
    embeddedDebugVersion: "v1.1.abc",
    runningDisplayVersion: "v1.1",
    runningDebugVersion: "v1.1.abc",
    runningDebugVersionOta: "v1.1.abc-fp-asset-ts",
    runtimeVersion: "ios-fp",
    updateId: "abc-123",
    isEmbeddedLaunch: false,
    launchSource: "ota",
    createdAt: "2026-05-01T00:00:00Z",
    pushPermission: "granted",
    occurred: "2026-05-31T12:00:00Z",
  };
}

describe("checkNativeStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sets typed proto fields from the payload", async () => {
    mockCheckNativeStatus.mockResolvedValue(mockResponse({}));

    await checkNativeStatus(basePayload());

    expect(mockCheckNativeStatus).toHaveBeenCalledTimes(1);
    const req = mockCheckNativeStatus.mock.calls[0][0];
    expect(req.getEasClientId()).toBe("00000000-0000-0000-0000-000000000001");
    expect(req.getInstallId()).toBe("install-1");
    expect(req.getPlatform()).toBe("ios");
    expect(req.getAppVersion()).toBe("1.1.20");
    expect(req.getUpdateId()).toBe("abc-123");
    expect(req.getLaunchSource()).toBe("ota");
    expect(req.getIsEmbeddedLaunch()).toBe(false);
    expect(req.hasCreatedAt()).toBe(true);
    expect(req.getCreatedAt()!.getSeconds()).toBe(
      Math.floor(Date.parse("2026-05-01T00:00:00Z") / 1000),
    );
    expect(req.hasOccurred()).toBe(true);
    expect(req.getPushPermission()).toBe("granted");
    expect(req.getDebugJson()).toBe("");
  });

  it("passes debug_json through verbatim", async () => {
    mockCheckNativeStatus.mockResolvedValue(mockResponse({}));

    await checkNativeStatus({
      ...basePayload(),
      debugJson: JSON.stringify({ pushPermissionInfo: { status: "granted" } }),
    });

    const req = mockCheckNativeStatus.mock.calls[0][0];
    expect(JSON.parse(req.getDebugJson())).toEqual({
      pushPermissionInfo: { status: "granted" },
    });
  });

  it("encodes timeSinceLastOpenSeconds as a duration", async () => {
    mockCheckNativeStatus.mockResolvedValue(mockResponse({}));

    await checkNativeStatus({ ...basePayload(), timeSinceLastOpenSeconds: 90 });

    const req = mockCheckNativeStatus.mock.calls[0][0];
    expect(req.hasTimeSinceLastOpen()).toBe(true);
    expect(req.getTimeSinceLastOpen()!.getSeconds()).toBe(90);
  });

  it("returns the response as a plain object", async () => {
    const updateInfo = {
      action: NativeUpdateAction.NATIVE_UPDATE_ACTION_STORE,
      required: true,
      actBy: { seconds: 1780000000, nanos: 0 },
      nagInterval: { seconds: 86400, nanos: 0 },
      message: "Please update to continue.",
      linkUrl: "https://apps.apple.com/app/id123",
      linkText: "Update now",
    };
    mockCheckNativeStatus.mockResolvedValue(mockResponse({ updateInfo }));

    const result = await checkNativeStatus(basePayload());
    expect(result).toEqual({ updateInfo });
  });

  it("propagates errors from the client", async () => {
    mockCheckNativeStatus.mockRejectedValue(new Error("Network error"));

    await expect(checkNativeStatus(basePayload())).rejects.toThrow(
      "Network error",
    );
  });
});
