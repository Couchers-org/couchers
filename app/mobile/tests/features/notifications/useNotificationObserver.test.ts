import { renderHook } from "@testing-library/react-native";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";

import { useNotificationObserver } from "@/features/notifications/useNotificationObserver";

jest.mock("expo-notifications", () => ({
  getLastNotificationResponse: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  DEFAULT_ACTION_IDENTIFIER: "expo.modules.notifications.actions.DEFAULT",
}));

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
}));

const getLastNotificationResponseMock =
  Notifications.getLastNotificationResponse as jest.Mock;
const addListenerMock =
  Notifications.addNotificationResponseReceivedListener as jest.Mock;

// Handled responses are remembered for the app's lifetime, so each test uses its own id
function notificationResponse(
  id: string,
  url: string,
  actionIdentifier: string = Notifications.DEFAULT_ACTION_IDENTIFIER,
) {
  return {
    actionIdentifier,
    notification: {
      date: 0,
      request: { identifier: id, content: { data: { url } } },
    },
  };
}

describe("useNotificationObserver", () => {
  const removeSubscription = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    getLastNotificationResponseMock.mockReturnValue(null);
    addListenerMock.mockReturnValue({ remove: removeSubscription });
  });

  it("navigates to the notification that cold-started the app on mount", () => {
    getLastNotificationResponseMock.mockReturnValue(
      notificationResponse(
        "cold-start",
        "https://couchers.org/connections/friends/?from=123",
      ),
    );

    renderHook(() => useNotificationObserver());

    expect(router.push).toHaveBeenCalledWith("/connections/friends/?from=123");
  });

  it("navigates when a notification is tapped while the app is running", () => {
    renderHook(() => useNotificationObserver());

    const onResponse = addListenerMock.mock.calls[0][0];
    onResponse(
      notificationResponse("running", "https://couchers.org/messages/chats/5"),
    );

    expect(router.push).toHaveBeenCalledWith("/messages/chats/5");
  });

  it("handles each notification only once", () => {
    const response = notificationResponse(
      "once",
      "https://couchers.org/events/1",
    );
    getLastNotificationResponseMock.mockReturnValue(response);

    renderHook(() => useNotificationObserver());
    addListenerMock.mock.calls[0][0](response);

    expect(router.push).toHaveBeenCalledTimes(1);
  });

  it("ignores non-default notification actions", () => {
    getLastNotificationResponseMock.mockReturnValue(
      notificationResponse(
        "other-action",
        "https://couchers.org/events/2",
        "some-other-action",
      ),
    );

    renderHook(() => useNotificationObserver());

    expect(router.push).not.toHaveBeenCalled();
  });

  it("stops listening on unmount", () => {
    const { unmount } = renderHook(() => useNotificationObserver());

    unmount();

    expect(removeSubscription).toHaveBeenCalled();
  });
});
