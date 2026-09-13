import * as Sharing from "expo-sharing";

import { addToCalendar } from "@/utils/addToCalendar";

const mockFile = {
  exists: false,
  delete: jest.fn(),
  create: jest.fn(),
  write: jest.fn(),
  uri: "file:///cache/event.ics",
};

jest.mock("expo-file-system", () => ({
  File: jest.fn().mockImplementation(() => mockFile),
  Paths: { cache: "file:///cache" },
}));

jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

describe("addToCalendar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFile.exists = false;
  });

  it("writes the base64 content to a cache file and shares it via the OS share sheet", async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);

    await addToCalendar("QkVHSU46VkNBTEVOREFS", "event.ics");

    expect(mockFile.create).toHaveBeenCalled();
    expect(mockFile.write).toHaveBeenCalledWith("QkVHSU46VkNBTEVOREFS", { encoding: "base64" });
    expect(Sharing.shareAsync).toHaveBeenCalledWith(mockFile.uri, {
      mimeType: "text/calendar",
      UTI: "text/calendar",
    });
  });

  it("deletes a pre-existing file at the destination before writing", async () => {
    mockFile.exists = true;
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);

    await addToCalendar("QkVHSU46VkNBTEVOREFS", "event.ics");

    expect(mockFile.delete).toHaveBeenCalled();
  });

  it("does not share the file when sharing is unavailable on the device", async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);

    await addToCalendar("QkVHSU46VkNBTEVOREFS", "event.ics");

    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  });
});
