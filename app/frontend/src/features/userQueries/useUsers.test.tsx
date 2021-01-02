import { act, renderHook } from "@testing-library/react-hooks";
import { QueryClient, QueryClientProvider } from "react-query";
import React from "react";
import { service } from "../../service";
import { wait } from "../../test/utils";
import { getUser } from "../../test/serviceMockDefaults";
import useUsers from "./useUsers";
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
    const { result, waitForNextUpdate } = renderHook(
      () => useUsers([1, 2, 3]),
      {
        wrapper,
      }
    );

    expect(result.current).toEqual({
      isLoading: true,
      isError: false,
      errors: [],
      data: undefined,
    });

    //await waitForNextUpdate();
  });
});

describe("when useUsers has loaded", () => {
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
    await act(() => wait(0));

    expect(result.current).toMatchObject({
      isLoading: false,
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
  it("is used instead of refetching", async () => {
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
    const { unmount } = renderHook(() => useUsers([1, 2, 3]), {
      wrapper: sharedClientWrapper,
    });
    expect(getUserMock).toBeCalledTimes(3);
    unmount();
    await wait(0);
    const { result } = renderHook(() => useUsers([1, 2, 3]), {
      wrapper: sharedClientWrapper,
    });
    expect(getUserMock).toBeCalledTimes(3);
    expect(result.current.isLoading).toBe(false);
  });

  it("is invalidated when requested", async () => {
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
    const { waitForNextUpdate } = renderHook(() => useUsers([1, 2, 3]), {
      wrapper: sharedClientWrapper,
    });
    expect(getUserMock).toBeCalledTimes(3);

    const { result } = renderHook(() => useUsers([1, 2, 3], true), {
      wrapper: sharedClientWrapper,
    });
    //causes hang
    //await waitForNextUpdate();
    expect(result.current.isLoading).toBe(false);
    expect(getUserMock).toBeCalledTimes(6);
  });

  it("is returned when stale if subsequent refetch queries fail", async () => {
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
    renderHook(() => useUsers([1, 2, 3]), {
      wrapper: sharedClientWrapper,
    });

    getUserMock.mockRejectedValue(new Error("Error fetching user data"));
    const { result, waitForValueToChange } = renderHook(
      () => useUsers([1, 2, 3], true),
      {
        wrapper: sharedClientWrapper,
      }
    );
    //causes hang
    //await waitForValueToChange(() => result.current.errors);

    expect(result.current).toMatchObject({
      isLoading: false,
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
});
