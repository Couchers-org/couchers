import { act, renderHook } from "@testing-library/react-hooks";
import { liteUserKey } from "features/queryKeys";
import useLiteUsers, { useLiteUser } from "features/userQueries/useLiteUsers";
import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { service } from "service";
import liteUsers from "test/fixtures/liteUsers.json";
import { getLiteUser } from "test/serviceMockDefaults";
import { mockConsoleError } from "test/utils";

const getLiteUserMock = service.user.getLiteUser as jest.Mock;

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
  getLiteUserMock.mockImplementation(getLiteUser);
});

describe("while queries are loading", () => {
  it("returns loading with no errors", async () => {
    const { result, waitFor } = renderHook(() => useLiteUsers([1, 2, 3]), {
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
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });
});

describe("useLiteUser (singular)", () => {
  it("works", async () => {
    const { result, waitForNextUpdate } = renderHook(() => useLiteUser(1), {
      wrapper,
    });
    await waitForNextUpdate();

    expect(getLiteUserMock).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual({
      data: liteUsers[0],
      error: "",
      isError: false,
      isFetching: false,
      isLoading: false,
    });
  });

  it("returns undefined when given undefined userId", async () => {
    const { result, waitFor } = renderHook(() => useLiteUser(undefined), {
      wrapper,
    });
    await waitFor(() => !result.current.isLoading);

    expect(getLiteUserMock).not.toHaveBeenCalled();
    expect(result.current).toEqual({
      data: undefined,
      error: "",
      isError: false,
      isFetching: false,
      isLoading: false,
    });
  });
});

describe("when useLiteUsers has loaded", () => {
  it("omits falsey user id", async () => {
    const { result, waitFor } = renderHook(() => useLiteUsers([0, undefined]), {
      wrapper,
    });
    await waitFor(() => !result.current.isLoading);
    expect(getLiteUserMock).not.toHaveBeenCalled();
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
    const { result, waitForNextUpdate } = renderHook(
      () => useLiteUsers([1, 2, 3]),
      {
        wrapper,
      }
    );
    await waitForNextUpdate();

    expect(getLiteUserMock).toHaveBeenCalledTimes(3);
    expect(result.current).toEqual({
      data: new Map([
        [1, liteUsers[0]],
        [2, liteUsers[1]],
        [3, liteUsers[2]],
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
    getLiteUserMock.mockImplementation((userId: string) => {
      return userId === "2"
        ? Promise.reject(new Error(`Error fetching user ${userId}`))
        : getLiteUser(userId);
    });

    const { result, waitForNextUpdate } = renderHook(
      () => useLiteUsers([1, 2, 3]),
      {
        wrapper,
      }
    );
    await waitForNextUpdate();

    expect(result.current).toMatchObject({
      data: new Map([
        [1, liteUsers[0]],
        [2, undefined],
        [3, liteUsers[2]],
      ]),
      errors: ["Error fetching user 2"],
      isError: true,
      isFetching: false,
      isLoading: false,
    });
  });

  it("returns isError as true with errors if all getUser queries fail", async () => {
    mockConsoleError();
    getLiteUserMock.mockRejectedValue(new Error("Error fetching user data"));

    const { result, waitForNextUpdate } = renderHook(
      () => useLiteUsers([1, 2, 3]),
      {
        wrapper,
      }
    );
    await waitForNextUpdate();

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
    sharedClient.setQueryData(liteUserKey(1), liteUsers[0]);
    sharedClient.setQueryData(liteUserKey(2), liteUsers[1]);
    sharedClient.setQueryData(liteUserKey(3), liteUsers[2]);
  });

  it("is used instead of refetching", async () => {
    const { result } = renderHook(() => useLiteUsers([1, 2, 3]), {
      wrapper: sharedClientWrapper,
    });
    expect(getLiteUserMock).not.toHaveBeenCalled();
    expect(result.current.isFetching).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("is invalidated when requested", async () => {
    const { waitForNextUpdate } = renderHook(
      () => useLiteUsers([1, 2, 3], true),
      {
        wrapper: sharedClientWrapper,
      }
    );

    expect(getLiteUserMock).toBeCalledTimes(3);
    await waitForNextUpdate();
  });

  it("is returned when stale if subsequent refetch queries fail", async () => {
    mockConsoleError();
    getLiteUserMock.mockRejectedValue(new Error("Error fetching user data"));
    const { result, waitForNextUpdate } = renderHook(
      () => useLiteUsers([1, 2, 3], true),
      {
        wrapper: sharedClientWrapper,
      }
    );
    await waitForNextUpdate();

    expect(result.current).toMatchObject({
      data: new Map([
        [1, liteUsers[0]],
        [2, liteUsers[1]],
        [3, liteUsers[2]],
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
    const { waitForNextUpdate, rerender } = renderHook(
      () => useLiteUsers([1, 2, 3], true),
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
        const users = useLiteUsers(ids, true);
        return { setIds, users };
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
    getLiteUserMock.mockClear();
    act(() => result.current.setIds([1, 2]));
    //testing for query.state.isInvalidated doesn't work here
    //probably await act(... waits too long
    expect(getLiteUserMock).toBeCalledTimes(2);
    await waitForNextUpdate();
  });

  it("returns isRefetching as true when new IDs are being added", async () => {
    const { result, waitForNextUpdate } = renderHook(
      () => {
        const [ids, setIds] = useState([1, 2, 3]);
        const users = useLiteUsers(ids);
        return { setIds, users };
      },
      {
        wrapper: sharedClientWrapper,
      }
    );

    act(() => result.current.setIds([1, 2, 3, 4]));
    // act waits too long so have to inspect the hook's render result
    // history to see `isRefetching` has one point become true
    expect(result.all[1]).toMatchObject({
      users: expect.objectContaining({
        isRefetching: true,
      }),
    });
    expect(getLiteUserMock).toHaveBeenCalledTimes(1);
    await waitForNextUpdate();
  });
});
