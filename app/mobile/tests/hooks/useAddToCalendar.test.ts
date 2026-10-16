import { renderHook } from "@testing-library/react-native";
import * as Calendar from "expo-calendar";
import { Alert, Platform } from "react-native";

import { useAddToCalendar } from "@/hooks/useAddToCalendar";

jest.mock("expo-calendar", () => ({
  createEventInCalendarAsync: jest.fn(),
  requestCalendarPermissionsAsync: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
  })),
}));

const event = {
  title: "Weekly Meetup",
  startDate: "2021-06-29T02:37:00Z",
  endDate: "2021-06-29T03:37:00Z",
  timeZone: "Europe/Amsterdam",
  location: "Concertgebouw",
  notes: "Be there or be square!\n\nhttps://couchers.org/event/1/weekly-meetup",
};

function setPlatform(os: string, version: string | number) {
  Object.defineProperty(Platform, "OS", { value: os, writable: true });
  Object.defineProperty(Platform, "Version", {
    value: version,
    writable: true,
  });
}

describe("useAddToCalendar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  it("opens the system add-event screen with the event details", async () => {
    setPlatform("android", 34);
    const { result } = renderHook(() => useAddToCalendar());

    await result.current.addToCalendar(event);

    expect(Calendar.createEventInCalendarAsync).toHaveBeenCalledWith({
      title: "Weekly Meetup",
      startDate: new Date("2021-06-29T02:37:00Z"),
      endDate: new Date("2021-06-29T03:37:00Z"),
      timeZone: "Europe/Amsterdam",
      location: "Concertgebouw",
      notes: event.notes,
    });
    expect(Calendar.requestCalendarPermissionsAsync).not.toHaveBeenCalled();
  });

  it("doesn't ask for calendar permission on iOS 17 and later", async () => {
    setPlatform("ios", "17.0");
    const { result } = renderHook(() => useAddToCalendar());

    await result.current.addToCalendar(event);

    expect(Calendar.requestCalendarPermissionsAsync).not.toHaveBeenCalled();
    expect(Calendar.createEventInCalendarAsync).toHaveBeenCalled();
  });

  it("asks for calendar permission before iOS 17", async () => {
    setPlatform("ios", "16.4");
    (Calendar.requestCalendarPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "granted",
      canAskAgain: true,
    });
    const { result } = renderHook(() => useAddToCalendar());

    await result.current.addToCalendar(event);

    expect(Calendar.requestCalendarPermissionsAsync).toHaveBeenCalled();
    expect(Calendar.createEventInCalendarAsync).toHaveBeenCalled();
  });

  it("offers to open Settings when permission was permanently denied", async () => {
    setPlatform("ios", "16.4");
    (Calendar.requestCalendarPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "denied",
      canAskAgain: false,
    });
    const { result } = renderHook(() => useAddToCalendar());

    await result.current.addToCalendar(event);

    expect(Calendar.createEventInCalendarAsync).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      "errors.calendar_permission_required",
      "errors.calendar_permission_denied_permanently",
      [
        { text: "common.cancel", style: "cancel" },
        { text: "common.open_settings", onPress: expect.any(Function) },
      ],
      { cancelable: true },
    );
  });

  it("shows an error when the calendar can't be opened", async () => {
    setPlatform("android", 34);
    (Calendar.createEventInCalendarAsync as jest.Mock).mockRejectedValue(
      new Error("No activity found to handle intent"),
    );
    const { result } = renderHook(() => useAddToCalendar());

    await result.current.addToCalendar(event);

    expect(Alert.alert).toHaveBeenCalledWith("errors.add_to_calendar_failed");
  });
});
