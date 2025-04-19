import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import mockRouter from "next-router-mock";
import { service } from "service";
import client from "service/client";
import { getHookWrapperWithClient } from "test/hookWrapper";
import i18n from "test/i18n";
import { listNotifications } from "test/serviceMockDefaults";
import { MockedService } from "test/utils";

import NotificationsFeed from "./NotificationsFeed";

const { t } = i18n;

jest.mock("service/client");

const markNotificationSeenMock = client.notifications
  .markNotificationSeen as jest.Mock<
  ReturnType<typeof client.notifications.markNotificationSeen>,
  Parameters<typeof client.notifications.markNotificationSeen>
>;

const listNotificationsMock = service.notifications
  .listNotifications as MockedService<
  typeof service.notifications.listNotifications
>;

const markAllNotificationsSeenMock = client.notifications
  .markAllNotificationsSeen as MockedService<
  typeof client.notifications.markAllNotificationsSeen
>;

const { wrapper } = getHookWrapperWithClient();

describe("NotificationsFeed", () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    listNotificationsMock.mockImplementation(listNotifications);
    markNotificationSeenMock.mockResolvedValue(new Empty());
    markAllNotificationsSeenMock.mockResolvedValue(new Empty());

    // Mocking XMLHttpRequest for Jest - this is the call for the avatar image
    global.XMLHttpRequest = jest.fn(() => ({
      open: jest.fn(),
      send: jest.fn(),
      setRequestHeader: jest.fn(),
      readyState: 4,
      status: 200,
      responseText: "{}",
      onreadystatechange: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    })) as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders notifications feed with new and earlier notifications", async () => {
    render(
      <NotificationsFeed
        anchorEl={document.createElement("div")}
        isOpen={true}
        onClose={mockOnClose}
      />,
      { wrapper },
    );

    // should be 2 notifications under new and 1 under earlier
    const newNotifications = await screen.findAllByTestId(
      "new-notification-item",
    );
    const earlierNotifications =
      await screen.findAllByTestId("notification-item");

    await waitFor(() => {
      expect(newNotifications).toHaveLength(2);
      expect(earlierNotifications).toHaveLength(1);
    });
  });

  it("marks notification as seen when clicked", async () => {
    const isNotSeenNotificationId = 2; // Assuming this is the ID of a notification that is not seen

    render(
      <NotificationsFeed
        anchorEl={document.createElement("div")}
        isOpen={true}
        onClose={mockOnClose}
      />,
      { wrapper },
    );

    //click first notification item
    const newNotificationItems = await screen.findAllByTestId(
      "new-notification-item",
    );

    await userEvent.click(newNotificationItems[0]);

    const callArg = markNotificationSeenMock.mock.calls[0][0];

    expect(callArg.toObject()).toMatchObject({
      notificationId: isNotSeenNotificationId,
      setSeen: true,
    });

    expect(mockRouter.pathname).toBe("/messages");

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("marks all notifications as seen when 'Mark all as read' is clicked", async () => {
    const latestNotificationId = 1;

    render(
      <NotificationsFeed
        anchorEl={document.createElement("div")}
        isOpen={true}
        onClose={mockOnClose}
      />,
      { wrapper },
    );

    const markAllReadButton = screen.getByText(
      t("notifications:mark_all_read"),
    );

    await userEvent.click(markAllReadButton);

    expect(markAllNotificationsSeenMock).toHaveBeenCalledTimes(1);

    const callArg = markAllNotificationsSeenMock.mock.calls[0][0];

    expect(callArg.toObject()).toMatchObject({
      latestNotificationId,
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("navigates to notification settings when 'Notification Settings' is clicked", async () => {
    render(
      <NotificationsFeed
        anchorEl={document.createElement("div")}
        isOpen={true}
        onClose={mockOnClose}
      />,
      { wrapper },
    );

    const notificationSettingsButton = screen.getByText(
      t("notifications:notification_settings.title"),
    );

    await userEvent.click(notificationSettingsButton);

    expect(mockRouter.pathname).toBe("/account-settings/notifications");
    expect(mockOnClose).toHaveBeenCalled();
  });
});
