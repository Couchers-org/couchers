import { act, render, screen, waitFor } from "@testing-library/react";
import mockRouter from "next-router-mock";
import { FriendRequest } from "proto/api_pb";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { getLiteUsers } from "test/serviceMockDefaults";

import FriendRequestsReceived from "./FriendRequestsReceived";

const { t } = i18n;

const getLiteUsersMock = service.user.getLiteUsers as jest.Mock;
const scrollIntoViewMock = Element.prototype.scrollIntoView as jest.Mock;
const listFriendRequestsMock = service.api.listFriendRequests as jest.Mock<
  ReturnType<typeof service.api.listFriendRequests>
>;

const pendingRequestFromUser3: FriendRequest.AsObject = {
  friendRequestId: 10,
  state: FriendRequest.FriendRequestStatus.PENDING,
  userId: 3,
  sent: false,
};

beforeEach(() => {
  scrollIntoViewMock.mockClear();
  mockRouter.setCurrentUrl("/connections/friends/");
  getLiteUsersMock.mockImplementation(getLiteUsers);
  listFriendRequestsMock.mockResolvedValue({
    receivedList: [],
    sentList: [],
  });
});

afterEach(() => jest.restoreAllMocks());

describe("FriendRequestsReceived with no ?from query param", () => {
  it("shows the empty state message when there are no pending requests", async () => {
    render(<FriendRequestsReceived />, { wrapper });

    expect(await screen.findByText(t("connections:no_friend_requests"))).toBeVisible();
    expect(screen.queryByText(t("connections:friend_request_no_longer_available"))).not.toBeInTheDocument();
  });

  it("shows pending requests without an alert", async () => {
    listFriendRequestsMock.mockResolvedValue({
      receivedList: [pendingRequestFromUser3],
      sentList: [],
    });

    render(<FriendRequestsReceived />, { wrapper });

    expect(await screen.findByRole("heading", { name: /Funny Kid/ })).toBeVisible();
    expect(screen.queryByText(t("connections:friend_request_no_longer_available"))).not.toBeInTheDocument();
  });
});

describe("FriendRequestsReceived with ?from=<userId> query param", () => {
  it("does not show an alert when the expected request is present", async () => {
    mockRouter.setCurrentUrl("/connections/friends/?from=3");
    listFriendRequestsMock.mockResolvedValue({
      receivedList: [pendingRequestFromUser3],
      sentList: [],
    });

    render(<FriendRequestsReceived />, { wrapper });

    await screen.findByRole("heading", { name: /Funny Kid/ });
    expect(screen.queryByText(t("connections:friend_request_no_longer_available"))).not.toBeInTheDocument();
  });

  it("shows an info alert when the expected request is not in the list", async () => {
    mockRouter.setCurrentUrl("/connections/friends/?from=3");

    render(<FriendRequestsReceived />, { wrapper });

    await waitFor(() => expect(screen.getByText(t("connections:friend_request_no_longer_available"))).toBeVisible());
  });

  it("shows an alert when requests exist but none are from the expected user", async () => {
    mockRouter.setCurrentUrl("/connections/friends/?from=3");
    listFriendRequestsMock.mockResolvedValue({
      receivedList: [
        {
          friendRequestId: 11,
          state: FriendRequest.FriendRequestStatus.PENDING,
          userId: 2,
          sent: false,
        },
      ],
      sentList: [],
    });

    render(<FriendRequestsReceived />, { wrapper });

    await waitFor(() => expect(screen.getByText(t("connections:friend_request_no_longer_available"))).toBeVisible());
    // The other (unrelated) request still renders
    expect(await screen.findByRole("heading", { name: /Funny Dog/ })).toBeVisible();
  });
});

describe("FriendRequestsReceived scrolling from a friend request notification", () => {
  it("scrolls to the friend requests section", async () => {
    mockRouter.setCurrentUrl("/connections/friends/?from=3");
    listFriendRequestsMock.mockResolvedValue({
      receivedList: [pendingRequestFromUser3],
      sentList: [],
    });

    render(<FriendRequestsReceived />, { wrapper });

    await screen.findByRole("heading", { name: /Funny Kid/ });
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(scrollIntoViewMock.mock.contexts[0]).toContainElement(
      screen.getByRole("heading", { name: t("connections:friend_requests") }),
    );
  });

  it("waits for the content above to load before scrolling, so it isn't pushed back down", async () => {
    mockRouter.setCurrentUrl("/connections/friends/?from=3");
    listFriendRequestsMock.mockResolvedValue({
      receivedList: [pendingRequestFromUser3],
      sentList: [],
    });

    const { rerender } = render(<FriendRequestsReceived isContentAboveLoaded={false} />, { wrapper });
    await screen.findByRole("heading", { name: /Funny Kid/ });
    expect(scrollIntoViewMock).not.toHaveBeenCalled();

    rerender(<FriendRequestsReceived isContentAboveLoaded />);
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
  });

  it("still scrolls to the section when the request is no longer available", async () => {
    mockRouter.setCurrentUrl("/connections/friends/?from=3");

    render(<FriendRequestsReceived />, { wrapper });

    await waitFor(() => expect(screen.getByText(t("connections:friend_request_no_longer_available"))).toBeVisible());
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
  });

  it("scrolls again when another friend request notification is opened on the same page", async () => {
    // e.g. tapping a second notification in the feed while already on Connections
    mockRouter.setCurrentUrl("/connections/friends/?from=3");
    listFriendRequestsMock.mockResolvedValue({
      receivedList: [pendingRequestFromUser3, { ...pendingRequestFromUser3, friendRequestId: 11, userId: 2 }],
      sentList: [],
    });

    render(<FriendRequestsReceived />, { wrapper });
    await screen.findByRole("heading", { name: /Funny Kid/ });
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);

    await act(async () => mockRouter.push("/connections/friends/?from=2"));
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(2);
  });

  it("doesn't scroll when not coming from a notification", async () => {
    listFriendRequestsMock.mockResolvedValue({
      receivedList: [pendingRequestFromUser3],
      sentList: [],
    });

    render(<FriendRequestsReceived />, { wrapper });

    await screen.findByRole("heading", { name: /Funny Kid/ });
    expect(scrollIntoViewMock).not.toHaveBeenCalled();
  });
});
