import { MenuList } from "@mui/material";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import mockRouter from "next-router-mock";
import { service } from "service";
import testNotifications from "test/fixtures/notifications.json";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { listNotifications } from "test/serviceMockDefaults";
import { MockedService } from "test/utils";

import NotificationItem from "./NotificationItem";

jest.mock("service/client");

const markNotificationIsSeenMock = service.notifications
  .markNotificationSeen as MockedService<
  typeof service.notifications.markNotificationSeen
>;

const listNotificationsMock = service.notifications
  .listNotifications as MockedService<
  typeof service.notifications.listNotifications
>;

const { wrapper } = getHookWrapperWithClient();

describe("NotificationItem", () => {
  const mockOnClose = jest.fn();
  const onMarkIsSeenMock = jest.fn();

  beforeEach(() => {
    listNotificationsMock.mockImplementation(listNotifications);
    markNotificationIsSeenMock.mockResolvedValue(new Empty());

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

  it("marks single notification as unseen when clicked", async () => {
    render(
      <MenuList>
        <NotificationItem
          notification={testNotifications.notificationsList[0]}
          onClose={mockOnClose}
          onMarkIsSeen={onMarkIsSeenMock}
        />
      </MenuList>,
      { wrapper },
    );

    const notificationItem = await screen.findByTestId("notification-item");

    const user = userEvent.setup();

    await user.hover(notificationItem);

    const markUnreadMenuButtons = await screen.findAllByTestId(
      "mark-unread-menu-button",
    );

    await user.click(markUnreadMenuButtons[0]);

    const markUnreadMenuItems = await screen.findAllByTestId(
      "mark-unread-menu-item",
    );

    await user.click(markUnreadMenuItems[0]);

    expect(onMarkIsSeenMock).toHaveBeenCalledWith({
      notificationId: testNotifications.notificationsList[0].notificationId,
      isSeen: false,
    });
  });

  it("marks a single notification as seen when clicked", async () => {
    render(
      <MenuList>
        <NotificationItem
          notification={testNotifications.notificationsList[1]}
          onClose={mockOnClose}
          onMarkIsSeen={onMarkIsSeenMock}
        />
      </MenuList>,
      { wrapper },
    );

    const notificationItem = await screen.findByTestId("notification-item");

    const user = userEvent.setup();

    await user.click(notificationItem);

    expect(onMarkIsSeenMock).toHaveBeenCalledWith({
      notificationId: testNotifications.notificationsList[1].notificationId,
      isSeen: true,
    });
  });

  it("calls onClose and routes to the notificationUrl when clicked", async () => {
    mockRouter.setCurrentUrl("/");

    render(
      <MenuList>
        <NotificationItem
          notification={testNotifications.notificationsList[0]}
          onClose={mockOnClose}
          onMarkIsSeen={onMarkIsSeenMock}
        />
      </MenuList>,
      { wrapper },
    );

    const notificationItem = await screen.findByTestId("notification-item");

    const user = userEvent.setup();

    await user.click(notificationItem);

    expect(mockOnClose).toHaveBeenCalled();
    expect(onMarkIsSeenMock).toHaveBeenCalledWith({
      notificationId: testNotifications.notificationsList[0].notificationId,
      isSeen: true,
    });

    // gets the part of the URL after the domain
    const expectedPath = testNotifications.notificationsList[0].url.replace(
      /^https?:\/\/[^/]+|\/$/g,
      "",
    );

    expect(mockRouter.pathname).toBe(expectedPath);
  });
});
