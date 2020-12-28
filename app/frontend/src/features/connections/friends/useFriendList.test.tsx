import { renderHook } from "@testing-library/react-hooks";
import { QueryClient, QueryClientProvider } from "react-query";
import React from "react";
import { service } from "../../../service";
import useFriendList from "./useFriendList";
import { getUser, listFriends } from "../../../test/serviceMockDefaults";

const listFriendsMock = service.api.listFriends as jest.Mock;
const getUserMock = service.user.getUser as jest.Mock;

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

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
      isLoading: true,
      isError: false,
      errors: [],
      friendQueries: [],
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
      isLoading: false,
      isError: false,
      errors: [],
      friendQueries: [
        expect.objectContaining({
          data: {
            name: "Funny Dog",
            userId: 2,
            username: "funnydog",
            avatarUrl: "funnydog.jpg",
          },
        }),
        expect.objectContaining({
          data: {
            name: "Funny Kid",
            userId: 3,
            username: "funnykid",
            avatarUrl: "funnykid.jpg",
          },
        }),
      ],
    });
  });

  it("returns isLoading as true with no errors if some getUser queries are loading", async () => {
    getUserMock.mockImplementation((userId: string) => {
      return userId === "2"
        ? getUser(userId)
        : new Promise((r) => setTimeout(() => r(getUser(userId)), 50));
    });

    const { result, waitForNextUpdate } = renderHook(() => useFriendList(), {
      wrapper,
    });
    await waitForNextUpdate({ timeout: 10 });

    expect(result.current).toMatchObject({
      isLoading: true,
      isError: false,
      errors: [],
      friendQueries: [
        {
          isLoading: false,
          isError: false,
          data: {
            name: "Funny Dog",
            userId: 2,
            username: "funnydog",
            avatarUrl: "funnydog.jpg",
          },
        },
        {
          isLoading: true,
          isError: false,
          data: undefined,
        },
      ],
    });
  });

  it("returns some friends data with errors if some getUser queries failed", async () => {
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
      isLoading: false,
      isError: false,
      errors: ["Error fetching user 2"],
      friendQueries: [
        {
          isLoading: false,
          isError: true,
          data: undefined,
        },
        {
          isLoading: false,
          isError: false,
          data: {
            name: "Funny Kid",
            userId: 3,
            username: "funnykid",
            avatarUrl: "funnykid.jpg",
          },
        },
      ],
    });
  });

  it("returns isError as true with errors if all getUser queries fail", async () => {
    getUserMock.mockRejectedValue(new Error(`Error fetching user data`));

    const { result, waitForNextUpdate } = renderHook(() => useFriendList(), {
      wrapper,
    });
    await waitForNextUpdate();

    expect(result.current).toMatchObject({
      isLoading: false,
      isError: true,
      errors: ["Error fetching user data", "Error fetching user data"],
      friendQueries: [
        {
          isLoading: false,
          isError: true,
          data: undefined,
        },
        {
          isLoading: false,
          isError: true,
          data: undefined,
        },
      ],
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
      isLoading: false,
      isError: true,
      errors: ["Error listing friends"],
      friendQueries: [],
    });
    expect(getUserMock).not.toHaveBeenCalled();
  });
});
