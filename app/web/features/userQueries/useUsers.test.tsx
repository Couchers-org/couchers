import { act, renderHook, waitFor } from "@testing-library/react";
import { userKey } from "features/queryKeys";
import useUsers, { useUser } from "features/userQueries/useUsers";
import React, { useState } from "react";
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

describe("while queries are loading", () => {
  it("returns loading with no errors", async () => {
    const { result } = renderHook(() => useUsers([1, 2, 3]), {
      wrapper,
    });

    expect(result.current).toEqual({
      data: undefined,
      errors: [],
      isError: false,
      isFetching: true,
      isLoading: true,
      isRefetching: false,
    });
  });
});

describe("useUser (singular)", () => {
  it("works", async () => {
    const { result } = renderHook(() => useUser(1), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getUserMock).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual({
      data: users[0],
      error: "",
      isError: false,
      isFetching: false,
      isLoading: false,
    });
  });

  it("returns undefined when given undefined userId", async () => {
    const { result } = renderHook(() => useUser(undefined), {
      wrapper,
    });
    await waitFor(() => !result.current.isLoading);

    expect(getUserMock).not.toHaveBeenCalled();
    expect(result.current).toEqual({
      data: undefined,
      error: "",
      isError: false,
      isFetching: false,
      isLoading: false,
    });
  });
});

describe("when useUsers has loaded", () => {
  it("omits falsey user id", async () => {
    const { result } = renderHook(() => useUsers([0, undefined]), {
      wrapper,
    });
    await waitFor(() => !result.current.isLoading);
    expect(getUserMock).not.toHaveBeenCalled();
    expect(result.current).toEqual({
      data: new Map(),
      errors: [],
      isError: false,
      isFetching: false,
      isLoading: false,
      isRefetching: false,
    });
  });

  it("returns the user data with no errors if all queries succeed", async () => {
    const { result } = renderHook(() => useUsers([1, 2, 3]), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getUserMock).toHaveBeenCalledTimes(3);
    expect(result.current).toEqual({
      data: new Map([
        [1, users[0]],
        [2, users[1]],
        [3, users[2]],
      ]),
      errors: [],
      isError: false,
      isFetching: false,
      isLoading: false,
      isRefetching: false,
    });
  });

  it("returns isError as true and some user data with the errors if some getUser queries failed", async () => {
    mockConsoleError();
    getUserMock.mockImplementation((userId: string) => {
      return userId === "2"
        ? Promise.reject(new Error(`Error fetching user ${userId}`))
        : getUser(userId);
    });

    const { result } = renderHook(() => useUsers([1, 2, 3]), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current).toMatchObject({
      data: new Map([
        [1, users[0]],
        [2, undefined],
        [3, users[2]],
      ]),
      errors: ["Error fetching user 2"],
      isError: true,
      isFetching: false,
      isLoading: false,
    });
  });

  it("returns isError as true with errors if all getUser queries fail", async () => {
    mockConsoleError();
    getUserMock.mockRejectedValue(new Error("Error fetching user data"));

    const { result } = renderHook(() => useUsers([1, 2, 3]), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current).toMatchObject({
      data: new Map([
        [1, undefined],
        [2, undefined],
        [3, undefined],
      ]),
      errors: [
        "Error fetching user data",
        "Error fetching user data",
        "Error fetching user data",
      ],
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
    sharedClient.setQueryData(userKey(1), users[0]);
    sharedClient.setQueryData(userKey(2), users[1]);
    sharedClient.setQueryData(userKey(3), users[2]);
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
    mockConsoleError();
    getUserMock.mockRejectedValue(new Error("Error fetching user data"));
    const { result } = renderHook(() => useUsers([1, 2, 3], true), {
      wrapper: sharedClientWrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current).toMatchObject({
      data: new Map([
        [1, users[0]],
        [2, users[1]],
        [3, users[2]],
      ]),
      errors: [
        "Error fetching user data",
        "Error fetching user data",
        "Error fetching user data",
      ],
      isError: true,
      isFetching: false,
      isLoading: false,
    });
  });

  it("is only invalidated on first render with invalidate=true", async () => {
    const { rerender } = renderHook(() => useUsers([1, 2, 3], true), {
      wrapper: sharedClientWrapper,
    });
    expect(
      sharedClient
        .getQueryCache()
        .getAll()
        .every((query) => query.state.isInvalidated),
    ).toBe(true);

    await waitFor(() => expect(getUserMock).toHaveBeenCalledTimes(3));

    expect(
      sharedClient
        .getQueryCache()
        .getAll()
        .every((query) => query.state.isInvalidated),
    ).toBe(false);
    rerender();
    expect(
      sharedClient
        .getQueryCache()
        .getAll()
        .every((query) => query.state.isInvalidated),
    ).toBe(false);
  });

  it("is invalidated with invalidate=true on id change", async () => {
    const { result } = renderHook(
      () => {
        const [ids, setIds] = useState([1, 2, 3]);
        const users = useUsers(ids, true);
        return { setIds, users };
      },
      {
        wrapper: sharedClientWrapper,
      },
    );
    expect(
      sharedClient
        .getQueryCache()
        .getAll()
        .every((query) => query.state.isInvalidated),
    ).toBe(true);

    await waitFor(() => expect(getUserMock).toHaveBeenCalledTimes(3));

    expect(
      sharedClient
        .getQueryCache()
        .getAll()
        .every((query) => query.state.isInvalidated),
    ).toBe(false);
    getUserMock.mockClear();
    act(() => result.current.setIds([1, 2]));
    //testing for query.state.isInvalidated doesn't work here
    //probably await act(... waits too long

    expect(getUserMock).toBeCalledTimes(2);
  });

  it("returns isRefetching as true when new IDs are being added", async () => {
    const { result } = renderHook(
      () => {
        const [ids, setIds] = useState([1, 2, 3]);
        const users = useUsers(ids);
        return { setIds, users };
      },
      {
        wrapper: sharedClientWrapper,
      },
    );

    act(() => result.current.setIds([1, 2, 3, 4]));

    expect(result.current).toMatchObject({
      users: expect.objectContaining({
        isRefetching: true,
      }),
    });
    expect(getUserMock).toHaveBeenCalledTimes(1);
  });
});
