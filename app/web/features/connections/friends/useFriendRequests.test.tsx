import { renderHook } from "@testing-library/react-hooks";
import { service } from "service";
import liteUsers from "test/fixtures/liteUsers.json";
import wrapper from "test/hookWrapper";
import { getLiteUsers } from "test/serviceMockDefaults";
import { mockConsoleError } from "test/utils";

import useFriendRequests from "./useFriendRequests";

const getLiteUsersMock = service.user.getLiteUsers as jest.Mock;
const listFriendRequestsMock = service.api.listFriendRequests as jest.Mock<
  ReturnType<typeof service.api.listFriendRequests>
>;

beforeEach(() => {
  getLiteUsersMock.mockImplementation(getLiteUsers);
  listFriendRequestsMock.mockResolvedValue({
    receivedList: [],
    sentList: [],
  });
});

afterEach(() => jest.restoreAllMocks());

describe("when the listFriendRequests query is loading", () => {
  it("returns isLoading as true with no errors and shouldn't try to load liteUsers", async () => {
    const { result, unmount } = renderHook(() => useFriendRequests("sent"), {
      wrapper,
    });

    expect(result.current).toEqual({
      data: undefined,
      errors: [],
      isError: false,
      isLoading: true,
    });
    expect(getLiteUsersMock).not.toHaveBeenCalled();

    unmount();
  });
});

describe("when the listFriendRequests succeeds", () => {
  beforeEach(() => {
    listFriendRequestsMock.mockResolvedValue({
      receivedList: [
        {
          friendRequestId: 2,
          state: 0,
          userId: 3,
          sent: false,
        },
        {
          friendRequestId: 3,
          state: 0,
          userId: 4,
          sent: false,
        },
      ],
      sentList: [
        {
          friendRequestId: 1,
          state: 0,
          userId: 2,
          sent: true,
        },
      ],
    });
  });

  it("returns isLoading as true with no errors if getLiteUsers queries are loading", async () => {
    getLiteUsersMock.mockImplementation(() => new Promise(() => void 0));

    const { result } = renderHook(() => useFriendRequests("sent"), { wrapper });

    expect(result.current.isLoading).toBe(true);
  });

  it("returns the friend requests sent if 'Sent' is passed to the hook", async () => {
    const { result, waitForNextUpdate } = renderHook(
      () => useFriendRequests("sent"),
      { wrapper }
    );
    await waitForNextUpdate();

    expect(result.current).toEqual({
      data: [
        {
          friend: liteUsers[1],
          friendRequestId: 1,
          state: 0,
          userId: 2,
          sent: true,
        },
      ],
      errors: [],
      isError: false,
      isLoading: false,
    });
  });

  it("returns the friend requests received if 'Received' is passed to the hook", async () => {
    const { result, waitForNextUpdate } = renderHook(
      () => useFriendRequests("received"),
      { wrapper }
    );
    await waitForNextUpdate();

    expect(result.current).toEqual({
      data: [
        {
          friend: liteUsers[2],
          friendRequestId: 2,
          state: 0,
          userId: 3,
          sent: false,
        },
        {
          friend: liteUsers[3],
          friendRequestId: 3,
          state: 0,
          userId: 4,
          sent: false,
        },
      ],
      errors: [],
      isError: false,
      isLoading: false,
    });
  });

  it("returns an empty friend requests correctly if none are sent nor received", async () => {
    listFriendRequestsMock.mockResolvedValue({
      receivedList: [],
      sentList: [],
    });

    const {
      result: receivedRequests,
      waitForNextUpdate: waitForReceivedFriendRequests,
    } = renderHook(() => useFriendRequests("received"), {
      wrapper,
    });
    await waitForReceivedFriendRequests();
    expect(receivedRequests.current).toEqual({
      data: [],
      errors: [],
      isError: false,
      isLoading: false,
    });

    const {
      result: sentRequests,
      waitForNextUpdate: waitForSentFriendRequests,
    } = renderHook(() => useFriendRequests("sent"), {
      wrapper,
    });
    await waitForSentFriendRequests();
    expect(sentRequests.current).toEqual({
      data: [],
      errors: [],
      isError: false,
      isLoading: false,
    });
  });

  it("returns isError as true with the error if the getLiteUsers query failed", async () => {
    const error = new Error("Error fetching users");
    getLiteUsersMock.mockRejectedValue(error);

    const { result, waitForNextUpdate } = renderHook(
      () => useFriendRequests("received"),
      { wrapper }
    );
    await waitForNextUpdate();

    expect(result.current).toEqual({
      data: [],
      errors: ["Error fetching users"],
      isError: true,
      isLoading: false,
    });
  });
});

describe("when the listFriendRequests query failed", () => {
  it("returns isError as true with the errors and shouldn't try to load liteUsers", async () => {
    listFriendRequestsMock.mockRejectedValue(
      new Error("Error listing friend requests")
    );
    mockConsoleError();
    const { result, waitForNextUpdate } = renderHook(
      () => useFriendRequests("sent"),
      { wrapper }
    );
    await waitForNextUpdate();

    expect(result.current).toEqual({
      data: [],
      errors: ["Error listing friend requests"],
      isError: true,
      isLoading: false,
    });
    expect(getLiteUsersMock).not.toHaveBeenCalled();
  });
});
