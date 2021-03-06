import { render, screen } from "@testing-library/react";
import {
  HostRequestsReceivedNotification,
  HostRequestsSentNotification,
  MessagesNotification,
} from "features/messages/Messages";
import React from "react";
import { service } from "service/index";
import user from "test/fixtures/defaultUser.json";
import wrapper from "test/hookWrapper";

const pingMock = service.api.ping as jest.Mock<
  ReturnType<typeof service.api.ping>,
  []
>;

afterEach(() => {
  jest.restoreAllMocks();
});

describe.each`
  name                                  | label        | count   | Component
  ${"HostRequestsReceivedNotification"} | ${"Hosting"} | ${"12"} | ${HostRequestsReceivedNotification}
  ${"HostRequestsSentNotification"}     | ${"Surfing"} | ${"34"} | ${HostRequestsSentNotification}
  ${"MessagesNotification"}             | ${"Chats"}   | ${"56"} | ${MessagesNotification}
`("$name", ({ label, count, Component }) => {
  it("shows the label with the number of unseen messages in a badge", async () => {
    pingMock.mockResolvedValue({
      pendingFriendRequestCount: 99,
      unseenMessageCount: 56,
      unseenReceivedHostRequestCount: 12,
      unseenSentHostRequestCount: 34,
      user,
    });
    render(<Component />, { wrapper });

    expect(await screen.findByText(label)).toBeVisible();
    expect(await screen.findByText(count)).toBeVisible();
  });

  it("shows the label without the number badge if the notification query failed", async () => {
    jest.spyOn(console, "error").mockReturnValue(undefined);
    pingMock.mockRejectedValue(new Error("API error"));
    render(<Component />, { wrapper });

    expect(await screen.findByText(label)).toBeVisible();
    expect(screen.queryByText(count)).not.toBeInTheDocument();
  });
});
