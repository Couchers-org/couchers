import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import mockRouter from "next-router-mock";
import { service } from "service";
import { getHookWrapperWithClient } from "test/hookWrapper";
import i18n from "test/i18n";
import { listNotifications } from "test/serviceMockDefaults";
import { MockedService } from "test/utils";

import NotificationsFeed from "./NotificationsFeed";

const { t } = i18n;

jest.mock("service/client");

const mockLogEvent = jest.fn();
jest.mock("features/analytics/eventCollector", () => ({
  logEvent: (...args: unknown[]) => mockLogEvent(...args),
}));

function loggedEvents(eventType: string) {
  return mockLogEvent.mock.calls.filter((call) => call[0] === eventType).map((call) => call[1]);
}

const markNotificationIsSeenMock = service.notifications.markNotificationSeen as MockedService<
  typeof service.notifications.markNotificationSeen
>;

const listNotificationsMock = service.notifications.listNotifications as MockedService<
  typeof service.notifications.listNotifications
>;

const markAllNotificationsIsSeenMock = service.notifications.markAllNotificationsSeen as MockedService<
  typeof service.notifications.markAllNotificationsSeen
>;

const { wrapper } = getHookWrapperWithClient();

describe("NotificationsFeed", () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockLogEvent.mockClear();
    listNotificationsMock.mockImplementation(listNotifications);
    markNotificationIsSeenMock.mockResolvedValue(new Empty());
    markAllNotificationsIsSeenMock.mockResolvedValue(new Empty());

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

  it("renders notifications feed with notifications", async () => {
    render(<NotificationsFeed anchorEl={document.createElement("div")} isOpen={true} onClose={mockOnClose} />, {
      wrapper,
    });

    const notifications = await screen.findAllByTestId("notification-item");

    await waitFor(() => {
      expect(notifications).toHaveLength(3);
    });
  });

  it("marks all notifications as seen when 'Mark all as read' is clicked", async () => {
    const latestNotificationId = 1;

    render(<NotificationsFeed anchorEl={document.createElement("div")} isOpen={true} onClose={mockOnClose} />, {
      wrapper,
    });

    await userEvent.click(screen.getByTestId("notifications-feed--more-options"));

    const markAllReadButton = screen.getByText(t("notifications:mark_all_read"));

    await waitFor(() => {
      expect(markAllReadButton).toBeVisible();
    });

    await userEvent.click(markAllReadButton);

    expect(markAllNotificationsIsSeenMock).toHaveBeenCalledWith(latestNotificationId);
    expect(loggedEvents("notifications.options_menu_closed")).toEqual([
      expect.objectContaining({ action: "mark_all_read" }),
    ]);
    expect(loggedEvents("notifications.mark_all_read")).toEqual([
      expect.objectContaining({
        latest_notification_id: latestNotificationId,
        loaded_count: 3,
        loaded_unseen_count: 2,
      }),
    ]);
  });

  it("logs the tray opening and closing with a summary of the loaded notifications", async () => {
    const { rerender } = render(
      <NotificationsFeed anchorEl={document.createElement("div")} isOpen={true} onClose={mockOnClose} badgeCount={2} />,
      { wrapper },
    );

    expect(loggedEvents("notifications.tray_opened")).toEqual([
      expect.objectContaining({ badge_count: 2, filter: "all" }),
    ]);

    await screen.findAllByTestId("notification-item");

    rerender(
      <NotificationsFeed
        anchorEl={document.createElement("div")}
        isOpen={false}
        onClose={mockOnClose}
        badgeCount={2}
      />,
    );

    expect(loggedEvents("notifications.tray_closed")).toEqual([
      expect.objectContaining({
        badge_count: 2,
        clicked_notification_id: null,
        loaded_count: 3,
        loaded_seen_count: 1,
        loaded_unseen_count: 2,
        notifications: [
          expect.objectContaining({ id: 1, topic_action: "friend_request:create", is_seen: true }),
          expect.objectContaining({ id: 2, topic_action: "chat:missed_messages", is_seen: false }),
          expect.objectContaining({ id: 3, topic_action: "reference:reminder_surfed", is_seen: false }),
        ],
      }),
    ]);
  });

  it("logs clicks on a notification", async () => {
    render(<NotificationsFeed anchorEl={document.createElement("div")} isOpen={true} onClose={mockOnClose} />, {
      wrapper,
    });

    const notifications = await screen.findAllByTestId("notification-item");
    await userEvent.click(notifications[1]);

    expect(loggedEvents("notifications.item_clicked")).toEqual([
      expect.objectContaining({
        notification_id: 2,
        topic_action: "chat:missed_messages",
        was_seen: false,
        position: 1,
        loaded_count: 3,
      }),
    ]);
  });

  it("logs the options menu being opened and abandoned", async () => {
    render(<NotificationsFeed anchorEl={document.createElement("div")} isOpen={true} onClose={mockOnClose} />, {
      wrapper,
    });

    await screen.findAllByTestId("notification-item");
    await userEvent.click(screen.getByTestId("notifications-feed--more-options"));
    await userEvent.keyboard("{Escape}");

    expect(loggedEvents("notifications.options_menu_opened")).toEqual([expect.objectContaining({ loaded_count: 3 })]);
    expect(loggedEvents("notifications.options_menu_closed")).toEqual([expect.objectContaining({ action: null })]);
  });

  it("logs the item menu being opened and used to mark a notification unread", async () => {
    render(<NotificationsFeed anchorEl={document.createElement("div")} isOpen={true} onClose={mockOnClose} />, {
      wrapper,
    });

    await userEvent.click((await screen.findAllByTestId("mark-unread-menu-button"))[0]);
    await userEvent.click(screen.getByTestId("mark-unread-menu-item"));

    expect(loggedEvents("notifications.item_menu_opened")).toEqual([
      expect.objectContaining({ notification_id: 1, was_seen: true }),
    ]);
    expect(loggedEvents("notifications.item_menu_closed")).toEqual([
      expect.objectContaining({ notification_id: 1, action: "mark_unread" }),
    ]);
    expect(loggedEvents("notifications.item_marked_unread")).toEqual([expect.objectContaining({ notification_id: 1 })]);
  });

  it("logs filter clicks", async () => {
    render(<NotificationsFeed anchorEl={document.createElement("div")} isOpen={true} onClose={mockOnClose} />, {
      wrapper,
    });

    await screen.findAllByTestId("notification-item");
    await userEvent.click(screen.getByText(t("notifications:notifications_filters.unread_button")));

    expect(loggedEvents("notifications.filter_clicked")).toEqual([
      expect.objectContaining({ filter: "all", new_filter: "unread", loaded_count: 3 }),
    ]);
  });

  it("navigates to notification settings when 'Notification Settings' is clicked", async () => {
    render(<NotificationsFeed anchorEl={document.createElement("div")} isOpen={true} onClose={mockOnClose} />, {
      wrapper,
    });

    await userEvent.click(screen.getByTestId("notifications-feed--more-options"));

    const notificationSettingsButton = screen.getByText(t("notifications:notification_settings.title"));

    await waitFor(() => {
      expect(notificationSettingsButton).toBeVisible();
    });

    await userEvent.click(notificationSettingsButton);

    expect(mockRouter.pathname).toBe("/account-settings/notifications");
    expect(mockOnClose).toHaveBeenCalled();
  });
});
