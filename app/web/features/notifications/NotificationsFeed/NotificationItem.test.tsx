import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { service } from "service";
import client from "service/client";
import testNotifications from "test/fixtures/notifications.json";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { listNotifications } from "test/serviceMockDefaults";
import { MockedService } from "test/utils";

import NotificationItem from "./NotificationItem";

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

const { wrapper } = getHookWrapperWithClient();

describe("NotificationItem", () => {
  const mockOnClose = jest.fn();
  const mockOnTouchedNotificationChange = jest.fn();

  beforeEach(() => {
    listNotificationsMock.mockImplementation(listNotifications);
    markNotificationSeenMock.mockResolvedValue(new Empty());

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
      <NotificationItem
        notification={testNotifications.notificationsList[0]}
        onClose={mockOnClose}
        onTouchedNotificationChange={mockOnTouchedNotificationChange}
      />,
      { wrapper },
    );

    const notificationItem = await screen.findByTestId("notification-item");

    const user = userEvent.setup();

    await user.hover(notificationItem);

    const markUnreadMenuButton = await screen.findByTestId(
      "mark-unread-menu-button",
    );

    await user.click(markUnreadMenuButton);

    const markUnreadMenuItem = await screen.findByTestId(
      "mark-unread-menu-item",
    );

    await user.click(markUnreadMenuItem);

    const callArg = markNotificationSeenMock.mock.calls[0][0];

    expect(callArg.toObject()).toMatchObject({
      notificationId: testNotifications.notificationsList[0].notificationId,

      setSeen: false,
    });

    expect(mockOnTouchedNotificationChange).toHaveBeenCalled();
  });
});
