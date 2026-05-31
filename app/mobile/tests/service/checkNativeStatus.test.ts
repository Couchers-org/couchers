import { NativeUpdateAction } from "@/proto/bugs_pb";
import { checkNativeStatus } from "@/service/checkNativeStatus";
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

describe("checkNativeStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("JSON-encodes the debug info into debug_json", async () => {
    mockCheckNativeStatus.mockResolvedValue(mockResponse({}));

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

    const result = await checkNativeStatus({ platform: "ios" });
    expect(result).toEqual({ updateInfo });
  });

  it("propagates errors from the client", async () => {
    mockCheckNativeStatus.mockRejectedValue(new Error("Network error"));

    await expect(checkNativeStatus({ platform: "ios" })).rejects.toThrow(
      "Network error",
    );
  });
});
