import { render, screen } from "@testing-library/react";
import React from "react";

import { service } from "../../service";
import user from "../../test/fixtures/defaultUser.json";
import wrapper from "../../test/hookWrapper";
import { HostRequestsNotification, MessagesNotification } from "./Messages";

const pingMock = service.api.ping as jest.Mock<
  ReturnType<typeof service.api.ping>,
  []
>;

afterEach(() => {
  jest.restoreAllMocks();
});

describe.each`
  name                          | label            | count   | Component
  ${"HostRequestsNotification"} | ${"Hosting"}     | ${"99"} | ${HostRequestsNotification}
  ${"MessagesNotification"}     | ${"Group Chats"} | ${"99"} | ${MessagesNotification}
`("$name", ({ label, count, Component }) => {
  it("shows the label with the number of unseen messages in a badge", async () => {
    pingMock.mockResolvedValue({
      user,
      pendingFriendRequestCount: 99,
      unseenHostRequestCount: 99,
      unseenMessageCount: 99,
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
