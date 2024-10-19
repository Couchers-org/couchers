import { renderHook } from "@testing-library/react-hooks";
import { liteUsersKey } from "features/queryKeys";
import { RpcError, StatusCode } from "grpc-web";
import { QueryClient, QueryClientProvider } from "react-query";
import { service } from "service";
import mockLiteUsers from "test/fixtures/liteUsers.json";
import { getLiteUsers } from "test/serviceMockDefaults";

import useLiteUsers from "./useLiteUsers";

jest.mock("service");

const mockGetLiteUsers = service.user.getLiteUsers as jest.Mock;

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

describe("useLiteUsers", () => {
  const ids = [1, 2, 3, 4];

  beforeEach(() => {
    mockGetLiteUsers.mockResolvedValue(getLiteUsers(ids));
  });

  it("Should return loading state correctly", () => {
    const { result } = renderHook(() => useLiteUsers(ids), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("Should return users map when loading is complete", async () => {
    const { result, waitForNextUpdate } = renderHook(() => useLiteUsers(ids), {
      wrapper,
    });

    await waitForNextUpdate();
    expect(mockGetLiteUsers).toHaveBeenCalledTimes(1);

    expect(result.current).toEqual(
      expect.objectContaining({
        data: new Map(mockLiteUsers.map((user) => [user.userId, user])),
        error: null,
        isError: false,
        isFetching: false,
        isLoading: false,
        isRefetching: false,
      })
    );
  });

  it("Should filter out undefined ids", async () => {
    const idsWithUndefined = [1, undefined, 3];

    renderHook(() => useLiteUsers(idsWithUndefined), { wrapper });

    expect(mockGetLiteUsers).toHaveBeenCalledWith([1, 3]);
  });

  it("Should return an error if the query fails", async () => {
    const error = new RpcError(500, "Some error", {});
    mockGetLiteUsers.mockRejectedValue(error);

    const { result, waitForNextUpdate } = renderHook(
      () => useLiteUsers([1, 2, 3]),
      { wrapper }
    );

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });

  it("Should not run the query when ids is an empty array", async () => {
    const ids: number[] = [];

    renderHook(() => useLiteUsers(ids), { wrapper });

    // Ensure the query function was NOT called
    expect(mockGetLiteUsers).not.toHaveBeenCalled();
  });

  it("Should not run the query function when ids is undefined", () => {
    const ids: (number | undefined)[] = [undefined];

    renderHook(() => useLiteUsers(ids), { wrapper });

    expect(mockGetLiteUsers).not.toHaveBeenCalled();
  });
});

describe("useLiteUsers - cached data", () => {
  const ids = [1, 2, 3, 4];

  const sharedClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const sharedClientWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={sharedClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();

    sharedClient.clear();
    // Set the cached data for the specific liteUserIds
    sharedClient.setQueryData(liteUsersKey(ids), getLiteUsers(ids));
  });

  it("Uses cached data instead of refetching", () => {
    const { result } = renderHook(() => useLiteUsers(ids), {
      wrapper: sharedClientWrapper,
    });

    expect(mockGetLiteUsers).not.toHaveBeenCalled();
    expect(result.current.isFetching).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("Should return cached data and set isError when fetching users fails", async () => {
    mockGetLiteUsers.mockRejectedValue(
      new RpcError(StatusCode.INTERNAL, "Error fetching user data", {})
    );

    const { result, waitForNextUpdate } = renderHook(
      () => useLiteUsers([1, 2, 3]),
      { wrapper: sharedClientWrapper }
    );

    await waitForNextUpdate();

    expect(result.current).toEqual(
      expect.objectContaining({
        data: undefined,
        error: new RpcError(
          StatusCode.INTERNAL,
          "Error fetching user data",
          {}
        ),
        isError: true,
        isFetching: false,
        isLoading: false,
        isRefetching: false,
      })
    );
  });
});
