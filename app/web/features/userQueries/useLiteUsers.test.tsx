import { renderHook } from "@testing-library/react-hooks";
import { liteUsersKey } from "features/queryKeys";
import { RpcError, StatusCode } from "grpc-web";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { service } from "service";
import liteUsers from "test/fixtures/liteUsers.json";

import useLiteUsers from "./useLiteUsers";

// @TODO - Figure out how to do mocks for some but not all of these tests
jest.mock("react-query");
jest.mock("service");

const mockUseQuery = useQuery as jest.Mock;
const mockGetLiteUsers = service.user.getLiteUsers as jest.Mock;

const liteUsersRes = {
  responsesList: [liteUsers[0], liteUsers[1], liteUsers[2]].map((user) => ({
    user,
  })),
};

describe("useLiteUsers", () => {
  beforeEach(() => {
    mockUseQuery.mockClear();
    mockGetLiteUsers.mockClear();
  });

  it("Should return loading state correctly", () => {
    mockUseQuery.mockReturnValue({
      isLoading: true,
      data: undefined,
    });

    const { result } = renderHook(() => useLiteUsers([1, 2, 3]));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("Should return users map when loading is complete", () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: liteUsersRes,
    });

    const { result } = renderHook(() => useLiteUsers([1, 2, 3]));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeInstanceOf(Map);
    expect(result.current.data?.get(1)?.name).toBe("Funny Cat current User");
    expect(result.current.data?.get(2)?.name).toBe("Funny Dog");
    expect(result.current.data?.get(3)?.name).toBe("Funny Kid");
  });

  it("Should filter out undefined ids", () => {
    const idsWithUndefined = [1, undefined, 3];

    renderHook(() => useLiteUsers(idsWithUndefined));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["liteUsers", 1, 3],
        queryFn: expect.any(Function),
      })
    );
  });

  it("Should return an error if the query fails", () => {
    const error = new RpcError(500, "Some error", {});
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error,
      data: undefined,
    });

    const { result } = renderHook(() => useLiteUsers([1, 2, 3]));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });

  it("Should not run the query when ids is an empty array", () => {
    const ids: number[] = [];

    renderHook(() => useLiteUsers(ids));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    );
    // Ensure the query function was NOT called
    expect(mockGetLiteUsers).not.toHaveBeenCalled();
  });

  it("Should not run the query when ids is undefined", () => {
    const ids: (number | undefined)[] = [undefined];

    renderHook(() => useLiteUsers(ids));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    );
    // Ensure the query function was NOT called
    expect(mockGetLiteUsers).not.toHaveBeenCalled();
  });
});

describe("useLiteUsers - cached data", () => {
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
    sharedClient.setQueryData(liteUsersKey([1, 2, 3]), liteUsersRes);
  });

  it("Uses cached data instead of refetching", async () => {
    const { result } = renderHook(() => useLiteUsers([1, 2, 3]), {
      wrapper: sharedClientWrapper,
    });

    expect(mockGetLiteUsers).not.toHaveBeenCalled();
    expect(result.current.isFetching).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toMatchObject(
      new Map([
        [1, liteUsers[0]],
        [2, liteUsers[1]],
        [3, liteUsers[2]],
      ])
    );
  });

  it("should return cached data and set isError when fetching users fails", async () => {
    mockGetLiteUsers.mockRejectedValue(
      new RpcError(StatusCode.INTERNAL, "Error fetching user data", {})
    );

    const { result, waitForNextUpdate } = renderHook(
      () => useLiteUsers([1, 2, 3]),
      { wrapper: sharedClientWrapper }
    );

    // Manually trigger a refetch
    result.current.refetch();

    // Wait for the refetch to process the error
    await waitForNextUpdate();

    expect(result.current.isError).toBe(true);
    expect(result.current.error?.message).toBe("Error fetching user data");

    // Check that cached data is still being used
    expect(result.current.data).toEqual(
      new Map([
        [1, liteUsers[0]],
        [2, liteUsers[1]],
        [3, liteUsers[2]],
      ])
    );
  });
});
