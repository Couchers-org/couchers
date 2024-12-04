import { renderHook } from "@testing-library/react-hooks";
import React from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { service } from "service";
import users from "test/fixtures/liteUsers.json";
import wrapper from "test/hookWrapper";
import { getLiteUsers, listFriends } from "test/serviceMockDefaults";
import { mockConsoleError, wait } from "test/utils";

import useFriendList from "./useFriendList";

const listFriendsMock = service.api.listFriends as jest.Mock;
const getLiteUsersMock = service.user.getLiteUsers as jest.Mock;

beforeEach(() => {
  listFriendsMock.mockImplementation(listFriends);
  getLiteUsersMock.mockImplementation(getLiteUsers);
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
    expect(getLiteUsersMock).not.toHaveBeenCalled();

    await waitForNextUpdate();
  });
});

describe("when the listFriends query succeeds", () => {
  it("returns the friends data with no errors if getLiteUsers query succeeds", async () => {
    const { result, waitForNextUpdate } = renderHook(() => useFriendList(), {
      wrapper,
    });
    await waitForNextUpdate();

    // Called twice since the user has two friends in the fixture data
    expect(getLiteUsersMock).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual({
      data: [users[1], users[2]],
      friendIds: [users[1].userId, users[2].userId],
      errors: [],
      isError: false,
      isLoading: false,
    });
  });

  it("returns isLoading as true with no errors if getLiteUsers query is loading", async () => {
    getLiteUsersMock.mockImplementation(() => new Promise(() => void 0));

    const { result, waitForNextUpdate } = renderHook(() => useFriendList(), {
      wrapper,
    });
    await waitForNextUpdate();

    expect(result.current).toMatchObject({
      data: [],
      errors: [],
      isError: false,
      isLoading: true,
    });
  });

  it("returns isError as true with errors if getLiteUsers query fails", async () => {
    mockConsoleError();
    getLiteUsersMock.mockRejectedValue(new Error("Error fetching user data"));

    const { result, waitForNextUpdate } = renderHook(() => useFriendList(), {
      wrapper,
    });
    await waitForNextUpdate();

    expect(result.current).toMatchObject({
      data: [undefined, undefined],
      errors: ["Error fetching user data"],
      isError: true,
      isLoading: false,
    });
  });
});

describe("when the listFriends query failed", () => {
  it("returns isError as true with the errors and shouldn't try to load users", async () => {
    mockConsoleError();
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
    expect(getLiteUsersMock).not.toHaveBeenCalled();
  });
});

describe("with cached user data", () => {
  it("returns isError as true with the stale data if subsequent refetch queries fail", async () => {
    mockConsoleError();
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
    getLiteUsersMock.mockRejectedValue(new Error("Error fetching user data"));

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
      errors: ["Error listing friends"],
      isError: true,
      isLoading: false,
    });
  });
});
