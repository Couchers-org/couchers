import { renderHook } from "@testing-library/react-hooks";

import { service } from "../../../service";
import wrapper from "../../../test/hookWrapper";
import { getUser } from "../../../test/serviceMockDefaults";
import useFriendRequests from "./useFriendRequests";

const getUserMock = service.user.getUser as jest.Mock;
const listFriendRequestsMock = service.api.listFriendRequests as jest.Mock<
  ReturnType<typeof service.api.listFriendRequests>
>;

beforeEach(() => {
  getUserMock.mockImplementation(getUser);
  listFriendRequestsMock.mockResolvedValue({
    receivedList: [],
    sentList: [],
  });
});

afterEach(() => jest.restoreAllMocks());

describe("when the listFriendRequests query is loading", () => {
  it("returns isLoading as true with no errors and shouldn't try to load users", async () => {
    const { result, unmount } = renderHook(() => useFriendRequests("Sent"), {
      wrapper,
    });

    expect(result.current).toEqual({
      data: undefined,
      errors: [],
      isError: false,
      isLoading: true,
    });
    expect(getUserMock).not.toHaveBeenCalled();

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
        },
        {
          friendRequestId: 3,
          state: 0,
          userId: 4,
        },
      ],
      sentList: [
        {
          friendRequestId: 1,
          state: 0,
          userId: 2,
        },
      ],
    });
  });

  it("returns isLoading as true with no errors if getUsers queries are loading", async () => {
    getUserMock.mockImplementation(() => new Promise(() => void 0));

    const { result, waitForNextUpdate } = renderHook(
      () => useFriendRequests("Sent"),
      { wrapper }
    );
    await waitForNextUpdate();

    expect(result.current).toEqual({
      data: undefined,
      errors: [],
      isError: false,
      isLoading: true,
    });
  });

  it("returns the friend requests sent if 'Sent' is passed to the hook", async () => {
    const { result, waitForNextUpdate } = renderHook(
      () => useFriendRequests("Sent"),
      { wrapper }
    );
    await waitForNextUpdate();

    expect(result.current).toEqual({
      data: [
        {
          friend: {
            age: 35,
            avatarUrl: "",
            city: "Helsinki, Finland",
            name: "Funny Dog",
            userId: 2,
            username: "funnydog",
          },
          friendRequestId: 1,
          state: 0,
          userId: 2,
        },
      ],
      errors: [],
      isError: false,
      isLoading: false,
    });
  });

  it("returns the friend requests received if 'Received' is passed to the hook", async () => {
    const { result, waitForNextUpdate } = renderHook(
      () => useFriendRequests("Received"),
      { wrapper }
    );
    await waitForNextUpdate();

    expect(result.current).toEqual({
      data: [
        {
          friend: {
            age: 28,
            avatarUrl: "https://loremflickr.com/200/200?user3",
            city: "London, UK",
            name: "Funny Kid",
            userId: 3,
            username: "funnykid",
          },
          friendRequestId: 2,
          state: 0,
          userId: 3,
        },
        {
          friend: {
            age: 28,
            avatarUrl: "https://loremflickr.com/200/200?user4",
            city: "Melbourne, Australia",
            name: "Funny Chicken",
            userId: 4,
            username: "funnyChicken",
          },
          friendRequestId: 3,
          state: 0,
          userId: 4,
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
    } = renderHook(() => useFriendRequests("Received"), {
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
    } = renderHook(() => useFriendRequests("Sent"), {
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

  it("returns isError as true with the error and missing friend data in request object of response if some getUser queries failed", async () => {
    getUserMock.mockImplementation((userId: string) => {
      return userId === "3"
        ? Promise.reject(new Error(`Error fetching user ${userId}`))
        : getUser(userId);
    });
    jest.spyOn(console, "error").mockReturnValue(undefined);

    const { result, waitForNextUpdate } = renderHook(
      () => useFriendRequests("Received"),
      { wrapper }
    );
    await waitForNextUpdate();

    expect(result.current).toEqual({
      data: [
        {
          friend: undefined,
          friendRequestId: 2,
          state: 0,
          userId: 3,
        },
        {
          friend: {
            age: 28,
            avatarUrl: "https://loremflickr.com/200/200?user4",
            city: "Melbourne, Australia",
            name: "Funny Chicken",
            userId: 4,
            username: "funnyChicken",
          },
          friendRequestId: 3,
          state: 0,
          userId: 4,
        },
      ],
      errors: ["Error fetching user 3"],
      isError: true,
      isLoading: false,
    });
  });
});

describe("when the listFriendRequests query failed", () => {
  it("returns isError as true with the errors and shouldn't try to load users", async () => {
    listFriendRequestsMock.mockRejectedValue(
      new Error("Error listing friend requests")
    );
    jest.spyOn(console, "error").mockReturnValue(undefined);

    const { result, waitForNextUpdate } = renderHook(
      () => useFriendRequests("Sent"),
      { wrapper }
    );
    await waitForNextUpdate();

    expect(result.current).toEqual({
      data: [],
      errors: ["Error listing friend requests"],
      isError: true,
      isLoading: false,
    });
    expect(getUserMock).not.toHaveBeenCalled();
  });
});
