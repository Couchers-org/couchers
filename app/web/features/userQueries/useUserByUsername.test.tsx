import { renderHook } from "@testing-library/react-hooks";
import { userKey } from "features/queryKeys";
import useUserByUsername from "features/userQueries/useUserByUsername";
import React from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { service } from "service";
import users from "test/fixtures/users.json";
import { getUser } from "test/serviceMockDefaults";
import { mockConsoleError } from "test/utils";

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

beforeEach(() => {
  getUserMock.mockImplementation(getUser);
});

describe("while loading", () => {
  it("returns loading with no errors", async () => {
    const { result, waitForNextUpdate } = renderHook(
      () => useUserByUsername("funnydog"),
      {
        wrapper,
      }
    );

    expect(result.current).toEqual({
      data: undefined,
      error: "",
      isError: false,
      isFetching: true,
      isLoading: true,
    });
    await waitForNextUpdate();
  });
});

describe("when user has loaded", () => {
  beforeEach(() => {
    //these tests get userId 2, the mock implementation only supports fetch by id
    getUserMock.mockResolvedValueOnce({ userId: 2, username: "funnydog" });
  });
  it("returns the user data with no errors", async () => {
    const { result, waitFor } = renderHook(
      () => useUserByUsername("funnydog"),
      {
        wrapper,
      }
    );
    await waitFor(() => !result.current.isLoading);

    expect(result.current).toEqual({
      data: users[1],
      error: "",
      isError: false,
      isFetching: false,
      isLoading: false,
    });
    expect(getUserMock).toHaveBeenCalledTimes(2);
  });

  it("returns isError as true and the errors if some getUser queries failed", async () => {
    mockConsoleError();
    getUserMock.mockRejectedValue(new Error("Error fetching user funnydog"));

    const { result, waitForNextUpdate } = renderHook(
      () => useUserByUsername("funnydog"),
      {
        wrapper,
      }
    );
    await waitForNextUpdate();

    expect(result.current).toMatchObject({
      data: undefined,
      error: "Error fetching user funnydog",
      isError: true,
      isFetching: false,
      isLoading: false,
    });
  });
});

describe("cached data", () => {
  const sharedClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const sharedClientWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={sharedClient}>{children}</QueryClientProvider>
  );
  beforeEach(async () => {
    sharedClient.clear();
    sharedClient.setQueryData(["username2Id", "funnydog"], {
      userId: 2,
      username: "funnydog",
    });
    sharedClient.setQueryData(userKey(2), {
      avatarUrl: "https://loremflickr.com/200/200?user2",
      name: "Funny Dog",
      userId: 2,
      username: "funnydog",
    });
  });

  it("is used instead of refetching", async () => {
    const { result } = renderHook(() => useUserByUsername("funnydog"), {
      wrapper: sharedClientWrapper,
    });

    expect(getUserMock).not.toHaveBeenCalled();
    expect(result.current.isFetching).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("is invalidated when requested, userid2user map not invalidated", async () => {
    const { waitForNextUpdate } = renderHook(
      () => useUserByUsername("funnydog", true),
      {
        wrapper: sharedClientWrapper,
      }
    );

    expect(getUserMock).toBeCalledTimes(1);
    await waitForNextUpdate();
  });

  it("is returned when stale if subsequent refetch queries fail", async () => {
    mockConsoleError();
    getUserMock.mockRejectedValue(new Error("Error fetching user data"));
    const { result, waitForNextUpdate } = renderHook(
      () => useUserByUsername("funnydog", true),
      {
        wrapper: sharedClientWrapper,
      }
    );
    await waitForNextUpdate();

    expect(result.current).toMatchObject({
      data: {
        avatarUrl: "https://loremflickr.com/200/200?user2",
        name: "Funny Dog",
        userId: 2,
        username: "funnydog",
      },
      error: "Error fetching user data",
      isError: true,
      isFetching: false,
      isLoading: false,
    });
  });
});
