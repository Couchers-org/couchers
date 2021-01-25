import { act, renderHook } from "@testing-library/react-hooks";
import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "react-query";

import { service } from "../../service";
import { getUser } from "../../test/serviceMockDefaults";
import useUsers, { useUser } from "./useUsers";

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
  getUserMock.mockImplementation(getUser);
});

describe("while queries are loading", () => {
  it("returns loading with no errors", async () => {
    const { result } = renderHook(() => useUsers([1, 2, 3]), {
      wrapper,
    });

    expect(result.current).toEqual({
      isLoading: true,
      isFetching: true,
      isError: false,
      errors: [],
      data: undefined,
    });
  });
});

describe("useUser (singular)", () => {
  it("works", async () => {
    const { result, waitForNextUpdate } = renderHook(() => useUser(1), {
      wrapper,
    });
    await waitForNextUpdate();

    expect(getUserMock).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual({
      isLoading: false,
      isFetching: false,
      isError: false,
      error: "",
      data: {
        name: "Funny Cat current User",
        userId: 1,
        username: "funnycat",
        avatarUrl: "funnycat.jpg",
      },
    });
  });

  it("returns undefined when given undefined userId", async () => {
    const { result, waitFor } = renderHook(() => useUser(undefined), {
      wrapper,
    });
    await waitFor(() => !result.current.isLoading);

    expect(getUserMock).not.toHaveBeenCalled();
    expect(result.current).toEqual({
      isLoading: false,
      isFetching: false,
      isError: false,
      error: "",
      data: undefined,
    });
  });
});

describe("when useUsers has loaded", () => {
  it("omits falsey user id", async () => {
    const { result, waitFor } = renderHook(() => useUsers([0, undefined]), {
      wrapper,
    });
    await waitFor(() => !result.current.isLoading);
    expect(getUserMock).not.toHaveBeenCalled();
    expect(result.current).toEqual({
      isLoading: false,
      isFetching: false,
      isError: false,
      errors: [],
      data: new Map(),
    });
  });

  it("returns the user data with no errors if all queries succeed", async () => {
    const { result, waitForNextUpdate } = renderHook(
      () => useUsers([1, 2, 3]),
      {
        wrapper,
      }
    );
    await waitForNextUpdate();

    expect(getUserMock).toHaveBeenCalledTimes(3);
    expect(result.current).toEqual({
      isLoading: false,
      isFetching: false,
      isError: false,
      errors: [],
      data: new Map([
        [
          1,
          {
            name: "Funny Cat current User",
            userId: 1,
            username: "funnycat",
            avatarUrl: "funnycat.jpg",
          },
        ],
        [
          2,
          {
            name: "Funny Dog",
            userId: 2,
            username: "funnydog",
            avatarUrl: "funnydog.jpg",
          },
        ],
        [
          3,
          {
            name: "Funny Kid",
            userId: 3,
            username: "funnykid",
            avatarUrl: "funnykid.jpg",
          },
        ],
      ]),
    });
  });

  it("returns isError as true and some user data with the errors if some getUser queries failed", async () => {
    getUserMock.mockImplementation((userId: string) => {
      return userId === "2"
        ? Promise.reject(new Error(`Error fetching user ${userId}`))
        : getUser(userId);
    });

    const { result, waitForNextUpdate } = renderHook(
      () => useUsers([1, 2, 3]),
      {
        wrapper,
      }
    );
    await waitForNextUpdate();

    expect(result.current).toMatchObject({
      isLoading: false,
      isFetching: false,
      isError: true,
      errors: ["Error fetching user 2"],
      data: new Map([
        [
          1,
          {
            name: "Funny Cat current User",
            userId: 1,
            username: "funnycat",
            avatarUrl: "funnycat.jpg",
          },
        ],
        [2, undefined],
        [
          3,
          {
            name: "Funny Kid",
            userId: 3,
            username: "funnykid",
            avatarUrl: "funnykid.jpg",
          },
        ],
      ]),
    });
  });

  it("returns isError as true with errors if all getUser queries fail", async () => {
    getUserMock.mockRejectedValue(new Error("Error fetching user data"));

    const { result, waitForNextUpdate } = renderHook(
      () => useUsers([1, 2, 3]),
      {
        wrapper,
      }
    );
    await waitForNextUpdate();

    expect(result.current).toMatchObject({
      isLoading: false,
      isFetching: false,
      isError: true,
      errors: [
        "Error fetching user data",
        "Error fetching user data",
        "Error fetching user data",
      ],
      data: new Map([
        [1, undefined],
        [2, undefined],
        [3, undefined],
      ]),
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
    sharedClient.setQueryData(["user", 1], {
      name: "Funny Cat current User",
      userId: 1,
      username: "funnycat",
      avatarUrl: "funnycat.jpg",
    });
    sharedClient.setQueryData(["user", 2], {
      name: "Funny Dog",
      userId: 2,
      username: "funnydog",
      avatarUrl: "funnydog.jpg",
    });
    sharedClient.setQueryData(["user", 3], {
      name: "Funny Kid",
      userId: 3,
      username: "funnykid",
      avatarUrl: "funnykid.jpg",
    });
    await sharedClient.refetchQueries();
  });

  it("is used instead of refetching", async () => {
    const { result } = renderHook(() => useUsers([1, 2, 3]), {
      wrapper: sharedClientWrapper,
    });
    expect(getUserMock).not.toHaveBeenCalled();
    expect(result.current.isFetching).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("is invalidated when requested", async () => {
    renderHook(() => useUsers([1, 2, 3], true), {
      wrapper: sharedClientWrapper,
    });

    expect(getUserMock).toBeCalledTimes(3);
  });

  it("is returned when stale if subsequent refetch queries fail", async () => {
    getUserMock.mockRejectedValue(new Error("Error fetching user data"));
    const { result, waitForNextUpdate } = renderHook(
      () => useUsers([1, 2, 3], true),
      {
        wrapper: sharedClientWrapper,
      }
    );
    await waitForNextUpdate();

    expect(result.current).toMatchObject({
      isLoading: false,
      isFetching: false,
      isError: true,
      errors: [
        "Error fetching user data",
        "Error fetching user data",
        "Error fetching user data",
      ],
      data: new Map([
        [
          1,
          {
            name: "Funny Cat current User",
            userId: 1,
            username: "funnycat",
            avatarUrl: "funnycat.jpg",
          },
        ],
        [
          2,
          {
            name: "Funny Dog",
            userId: 2,
            username: "funnydog",
            avatarUrl: "funnydog.jpg",
          },
        ],
        [
          3,
          {
            name: "Funny Kid",
            userId: 3,
            username: "funnykid",
            avatarUrl: "funnykid.jpg",
          },
        ],
      ]),
    });
  });

  it("is only invalidated on first render with invalidate=true", async () => {
    const { waitForNextUpdate, rerender } = renderHook(
      () => useUsers([1, 2, 3], true),
      {
        wrapper: sharedClientWrapper,
      }
    );
    expect(
      sharedClient
        .getQueryCache()
        .getAll()
        .every((query) => query.state.isInvalidated)
    ).toBe(true);
    await waitForNextUpdate();
    expect(
      sharedClient
        .getQueryCache()
        .getAll()
        .every((query) => query.state.isInvalidated)
    ).toBe(false);
    rerender();
    expect(
      sharedClient
        .getQueryCache()
        .getAll()
        .every((query) => query.state.isInvalidated)
    ).toBe(false);
  });

  it("is invalidated with invalidate=true on id change", async () => {
    const { result, waitForNextUpdate } = renderHook(
      () => {
        const [ids, setIds] = useState([1, 2, 3]);
        const users = useUsers(ids, true);
        return { users, setIds };
      },
      {
        wrapper: sharedClientWrapper,
      }
    );
    expect(
      sharedClient
        .getQueryCache()
        .getAll()
        .every((query) => query.state.isInvalidated)
    ).toBe(true);
    await waitForNextUpdate();
    expect(
      sharedClient
        .getQueryCache()
        .getAll()
        .every((query) => query.state.isInvalidated)
    ).toBe(false);
    getUserMock.mockClear();
    await act(() => result.current.setIds([1, 2]));
    //testing for query.state.isInvalidated doesn't work here
    //probably await act(... waits too long
    expect(getUserMock).toBeCalledTimes(2);
  });
});
