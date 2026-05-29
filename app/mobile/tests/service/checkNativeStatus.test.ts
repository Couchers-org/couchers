import { NativeUpdateAction } from "@/proto/bugs_pb";
import { checkNativeStatus } from "@/service/checkNativeStatus";
import client from "@/service/client";

jest.mock("@/service/client", () => ({
  bugs: {
    checkNativeStatus: jest.fn(),
  },
}));

const mockCheckNativeStatus = client.bugs.checkNativeStatus as jest.Mock;

function mockResponse(
  info: Partial<{
    action: NativeUpdateAction;
    required: boolean;
    actBy: Date;
    message: string;
    linkUrl: string;
  }> | null = {},
) {
  return {
    getUpdateInfo: () =>
      info === null
        ? undefined
        : {
            getAction: () =>
              info.action ?? NativeUpdateAction.NATIVE_UPDATE_ACTION_NONE,
            getRequired: () => info.required ?? false,
            getActBy: () =>
              info.actBy ? { toDate: () => info.actBy } : undefined,
            getMessage: () => info.message ?? "",
            getLinkUrl: () => info.linkUrl ?? "",
          },
  };
}

describe("checkNativeStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("JSON-encodes the debug info into debug_json", async () => {
    mockCheckNativeStatus.mockResolvedValue(mockResponse());

    const debugInfo = {
      installId: "install-1",
      userState: "authenticated",
      appVersion: "1.1.20",
      platform: "ios",
    };
    await checkNativeStatus(debugInfo);

    expect(mockCheckNativeStatus).toHaveBeenCalledTimes(1);
    const req = mockCheckNativeStatus.mock.calls[0][0];
    expect(JSON.parse(req.getDebugJson())).toEqual(debugInfo);
  });

  it("maps the backend's update info", async () => {
    const actBy = new Date("2026-06-01T00:00:00.000Z");
    mockCheckNativeStatus.mockResolvedValue(
      mockResponse({
        action: NativeUpdateAction.NATIVE_UPDATE_ACTION_STORE,
        required: true,
        actBy,
        message: "Please update to continue.",
        linkUrl: "https://apps.apple.com/app/id123",
      }),
    );

    const result = await checkNativeStatus({ platform: "ios" });
    expect(result).toEqual({
      action: NativeUpdateAction.NATIVE_UPDATE_ACTION_STORE,
      required: true,
      actBy,
      message: "Please update to continue.",
      linkUrl: "https://apps.apple.com/app/id123",
    });
  });

  it("defaults to NONE when the backend sends no update info", async () => {
    mockCheckNativeStatus.mockResolvedValue(mockResponse(null));

    const result = await checkNativeStatus({ platform: "ios" });
    expect(result).toEqual({
      action: NativeUpdateAction.NATIVE_UPDATE_ACTION_NONE,
      required: false,
      actBy: undefined,
      message: "",
      linkUrl: "",
    });
  });

  it("propagates errors from the client", async () => {
    mockCheckNativeStatus.mockRejectedValue(new Error("Network error"));

    await expect(checkNativeStatus({ platform: "ios" })).rejects.toThrow(
      "Network error",
    );
  });
});
