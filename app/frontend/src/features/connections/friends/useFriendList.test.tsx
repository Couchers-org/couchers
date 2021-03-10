import { renderHook } from "@testing-library/react-hooks";
import React from "react";
import { QueryClient, QueryClientProvider } from "react-query";

import { service } from "../../../service";
import wrapper from "../../../test/hookWrapper";
import { getUser, listFriends } from "../../../test/serviceMockDefaults";
import { wait } from "../../../test/utils";
import useFriendList from "./useFriendList";

const listFriendsMock = service.api.listFriends as jest.Mock;
const getUserMock = service.user.getUser as jest.Mock;

beforeAll(() => {
  // Mock out console.error so the test output is less noisy when
  // an error is intentionally thrown for negative tests
  jest.spyOn(console, "error").mockReturnValue(undefined);
});

beforeEach(() => {
  listFriendsMock.mockImplementation(listFriends);
  getUserMock.mockImplementation(getUser);
});

describe("when the listFriends query is loading", () => {
  it("returns loading with no errors and shouldn't try to load users", async () => {
    const { result, waitForNextUpdate } = renderHook(() => useFriendList(), {
      wrapper,
    });

    expect(result.current).toEqual({
      data: undefined,
      errors: [],
      isError: false,
      isLoading: true,
    });
    expect(getUserMock).not.toHaveBeenCalled();

    await waitForNextUpdate();
  });
});

describe("when the listFriends query succeeds", () => {
  it("returns the friends data with no errors if all getUser queries succeed", async () => {
    const { result, waitForNextUpdate } = renderHook(() => useFriendList(), {
      wrapper,
    });
    await waitForNextUpdate();

    // Called twice since the user has two friends in the fixture data
    expect(getUserMock).toHaveBeenCalledTimes(2);
    expect(result.current).toEqual({
      data: [
        {
          age: 35,
          avatarUrl: "",
          city: "Helsinki, Finland",
          name: "Funny Dog",
          userId: 2,
          username: "funnydog",
        },
        {
          age: 28,
          avatarUrl: "https://loremflickr.com/200/200?user3",
          city: "London, UK",
          name: "Funny Kid",
          userId: 3,
          username: "funnykid",
        },
      ],
      errors: [],
      isError: false,
      isLoading: false,
    });
  });

  it("returns isLoading as true with no errors if some getUser queries are loading", async () => {
    getUserMock.mockImplementation((userId: string) => {
      return userId === "2" ? getUser(userId) : new Promise(() => void 0);
    });

    const { result, waitForNextUpdate } = renderHook(() => useFriendList(), {
      wrapper,
    });
    await waitForNextUpdate();

    expect(result.current).toMatchObject({
      data: [
        {
          avatarUrl: "",
          name: "Funny Dog",
          userId: 2,
          username: "funnydog",
        },
        undefined,
      ],
      errors: [],
      isError: false,
      isLoading: true,
    });
  });

  it("returns isError as true and some friends data with the errors if some getUser queries failed", async () => {
    getUserMock.mockImplementation((userId: string) => {
      return userId === "2"
        ? Promise.reject(new Error(`Error fetching user ${userId}`))
        : getUser(userId);
    });

    const { result, waitForNextUpdate } = renderHook(() => useFriendList(), {
      wrapper,
    });
    await waitForNextUpdate();

    expect(result.current).toMatchObject({
      data: [
        undefined,
        {
          avatarUrl: "https://loremflickr.com/200/200?user3",
          name: "Funny Kid",
          userId: 3,
          username: "funnykid",
        },
      ],
      errors: ["Error fetching user 2"],
      isError: true,
      isLoading: false,
    });
  });

  it("returns isError as true with errors if all getUser queries fail", async () => {
    getUserMock.mockRejectedValue(new Error("Error fetching user data"));

    const { result, waitForNextUpdate } = renderHook(() => useFriendList(), {
      wrapper,
    });
    await waitForNextUpdate();

    expect(result.current).toMatchObject({
      data: [undefined, undefined],
      errors: ["Error fetching user data", "Error fetching user data"],
      isError: true,
      isLoading: false,
    });
  });
});

describe("when the listFriends query failed", () => {
  it("returns isError as true with the errors and shouldn't try to load users", async () => {
    listFriendsMock.mockRejectedValue(new Error("Error listing friends"));
    const { result, waitForNextUpdate } = renderHook(() => useFriendList(), {
      wrapper,
    });

    await waitForNextUpdate();

    expect(result.current).toMatchObject({
      data: undefined,
      errors: ["Error listing friends"],
      isError: true,
      isLoading: false,
    });
    expect(getUserMock).not.toHaveBeenCalled();
  });
});

describe("with cached user data", () => {
  it("returns isError as true with the stale data if subsequent refetch queries fail", async () => {
    const sharedClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const sharedClientWrapper = ({
      children,
    }: {
      children: React.ReactNode;
    }) => (
      <QueryClientProvider client={sharedClient}>
        {children}
      </QueryClientProvider>
    );
    renderHook(() => useFriendList(), {
      wrapper: sharedClientWrapper,
    });
    await wait(0);

    listFriendsMock.mockRejectedValue(new Error("Error listing friends"));
    getUserMock.mockRejectedValue(new Error("Error fetching user data"));

    const { result, waitForNextUpdate } = renderHook(() => useFriendList(), {
      wrapper: sharedClientWrapper,
    });
    await waitForNextUpdate();

    expect(result.current).toMatchObject({
      data: [
        {
          avatarUrl: "",
          name: "Funny Dog",
          userId: 2,
          username: "funnydog",
        },
        {
          avatarUrl: "https://loremflickr.com/200/200?user3",
          name: "Funny Kid",
          userId: 3,
          username: "funnykid",
        },
      ],
      errors: [
        "Error listing friends",
        "Error fetching user data",
        "Error fetching user data",
      ],
      isError: true,
      isLoading: false,
    });
  });
});
