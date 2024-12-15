import { renderHook } from "@testing-library/react-hooks";
import { reactQueryRetries } from "appConstants";
import { liteUserKey, liteUsersKey } from "features/queryKeys";
import { RpcError, StatusCode } from "grpc-web";
import { QueryClient, QueryClientProvider } from "react-query";
import { service } from "service";
import mockLiteUsers from "test/fixtures/liteUsers.json";
import { getLiteUser, getLiteUsers } from "test/serviceMockDefaults";
import { mockConsoleError } from "test/utils";

import { userStaleTime } from "./constants";
import { useLiteUser, useLiteUsers } from "./useLiteUsers";

jest.mock("service");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: userStaleTime,
      retry: (failureCount, error) => {
        // don't retry if the user isn't found
        return (
          (error as RpcError).code !== StatusCode.NOT_FOUND &&
          failureCount < reactQueryRetries
        );
      },
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useLiteUsers & useLiteUser", () => {
  describe("useLiteUsers", () => {
    const mockGetLiteUsers = service.user.getLiteUsers as jest.Mock;

    const ids = [1, 2, 3, 4, 5];
    const mockLiteUsersMap = new Map(
      mockLiteUsers.map((user) => [user.userId, user])
    );

    beforeEach(() => {
      jest.clearAllMocks();
      queryClient.clear();
    });

    it("Should return loading state correctly", async () => {
      const { result, waitFor } = renderHook(() => useLiteUsers(ids), {
        wrapper,
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
      await waitFor(() => expect(result.current.isLoading).toBe(false));
    });

    it("Should return users map when loading is complete", async () => {
      mockGetLiteUsers.mockResolvedValue(getLiteUsers(ids));

      const { result, waitForNextUpdate } = renderHook(
        () => useLiteUsers(ids),
        {
          wrapper,
        }
      );

      await waitForNextUpdate();
      expect(mockGetLiteUsers).toHaveBeenCalledTimes(1);

      expect(result.current).toEqual(
        expect.objectContaining({
          data: mockLiteUsersMap,
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

      const { result, waitFor } = renderHook(
        () => useLiteUsers(idsWithUndefined),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockGetLiteUsers).toHaveBeenCalledWith([1, 3]);
    });

    it("Should return an error if the query fails", async () => {
      mockConsoleError();
      const error = new RpcError(500, "Some error", {});
      mockGetLiteUsers.mockRejectedValue(error);

      const { result, waitForNextUpdate } = renderHook(
        () => useLiteUsers([1, 2, 3]),
        { wrapper }
      );

      // Wait for the initial hook to load the data and then fail
      await waitForNextUpdate(); // First attempt
      await waitForNextUpdate(); // One retry allowed

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

    it("Should not run the query function when ids is undefined", async () => {
      const ids: (number | undefined)[] = [undefined];

      const { result, waitFor } = renderHook(() => useLiteUsers(ids), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockGetLiteUsers).not.toHaveBeenCalled();
    });

    it("Should return cached data and not call getLiteUsers again if data is fresh", async () => {
      mockGetLiteUsers.mockResolvedValueOnce(getLiteUsers(ids));

      // Render the hook for the first time
      const { result, waitForNextUpdate, rerender } = renderHook(
        () => useLiteUsers(ids),
        {
          wrapper,
        }
      );

      // Wait for the initial hook to load the data
      await waitForNextUpdate();

      // Check that the hook has the expected data and `getLiteUsers` was called
      expect(result.current.data).toBeDefined();
      expect(result.current.data).toEqual(mockLiteUsersMap);
      expect(mockGetLiteUsers).toHaveBeenCalledTimes(1);

      // Rerender the hook with the same query key (should use cached data)
      rerender();

      // Ensure that `getLiteUsers` is not called again, confirming cache usage
      expect(service.user.getLiteUsers).toHaveBeenCalledTimes(1); // No new fetch should occur
      expect(result.current.data).toEqual(mockLiteUsersMap);
      expect(result.current.isFetching).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it("Should refetch data if it is stale", async () => {
      mockGetLiteUsers.mockResolvedValueOnce(getLiteUsers(ids));

      // Render the hook with the wrapper
      const { result, waitForNextUpdate, rerender } = renderHook(
        () => useLiteUsers(ids),
        { wrapper }
      );

      // Wait for the initial fetch to complete
      await waitForNextUpdate();

      // Confirm that initial data was loaded
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isStale).toBe(false);
      expect(result.current.data).toEqual(mockLiteUsersMap);
      expect(mockGetLiteUsers).toHaveBeenCalledTimes(1);

      // Mock a new response for the refetch
      mockGetLiteUsers.mockResolvedValueOnce(getLiteUsers(ids));

      // Invalidate the query to mark the data as stale
      queryClient.invalidateQueries(liteUsersKey(ids));

      // Trigger a rerender that should cause a refetch due to stale data
      rerender();

      // Confirm that initial data is marked as stale and refetching
      expect(result.current.isStale).toBe(true);
      expect(result.current.isRefetching).toBe(true);

      // Wait for the refetch to complete
      await waitForNextUpdate();

      // Confirm that the data has been updated after the refetch
      expect(result.current.isStale).toBe(false);
      expect(result.current.data).toEqual(mockLiteUsersMap);
      expect(mockGetLiteUsers).toHaveBeenCalledTimes(2);
    });

    it("Should use cached data if subsequent queries fail", async () => {
      mockGetLiteUsers.mockResolvedValueOnce(getLiteUsers(ids));

      // Render the hook with the wrapper
      const { result, waitForNextUpdate, rerender } = renderHook(
        () => useLiteUsers(ids),
        { wrapper }
      );

      // Wait for the initial fetch to complete
      await waitForNextUpdate();

      // Confirm that initial data was loaded
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isStale).toBe(false);
      expect(result.current.data).toEqual(mockLiteUsersMap);
      expect(mockGetLiteUsers).toHaveBeenCalledTimes(1);

      // Mock a new response for the refetch
      mockGetLiteUsers.mockRejectedValue(new RpcError(500, "Some error", {}));

      // Invalidate the query to mark the data as stale
      queryClient.invalidateQueries(liteUsersKey(ids));

      // Trigger a rerender that should cause a refetch due to stale data
      rerender();

      // Confirm that initial data is marked as stale and refetching
      expect(result.current.isStale).toBe(true);
      expect(result.current.isRefetching).toBe(true);

      // Wait for the refetch to complete
      await waitForNextUpdate(); // first failed attempt
      await waitForNextUpdate(); // second failed attempt

      // Confirm that the stale data from cache has been returned and isError is true
      expect(result.current.isStale).toBe(true);
      expect(result.current.isError).toBe(true);
      expect(result.current.data).toEqual(mockLiteUsersMap);
      expect(mockGetLiteUsers).toHaveBeenCalledTimes(3);
    });
  });

  describe("useLiteUser (singular)", () => {
    const mockGetLiteUser = service.user.getLiteUser as jest.Mock;

    beforeEach(() => {
      jest.clearAllMocks();
      queryClient.clear();
    });

    it("Should return loading state correctly", async () => {
      mockGetLiteUser.mockResolvedValue(getLiteUser("1"));

      const { result, waitFor } = renderHook(() => useLiteUser(1), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      await waitFor(() => expect(result.current.isLoading).toBe(false));
    });

    it("Should return user when loading is complete", async () => {
      mockGetLiteUser.mockResolvedValue(getLiteUser("2"));

      const { result, waitForNextUpdate } = renderHook(() => useLiteUser(1), {
        wrapper,
      });

      await waitForNextUpdate();

      expect(result.current.isLoading).toBe(false);
      expect(mockGetLiteUser).toHaveBeenCalledTimes(1);

      expect(result.current).toEqual(
        expect.objectContaining({
          data: mockLiteUsers[1],
          error: null,
          isError: false,
          isFetching: false,
          isLoading: false,
          isRefetching: false,
        })
      );
    });

    it("Should return an error if the query fails", async () => {
      mockConsoleError();
      const error = new RpcError(500, "Some error", {});
      mockGetLiteUser.mockRejectedValue(error);

      const { result, waitForNextUpdate } = renderHook(() => useLiteUser(1), {
        wrapper,
      });

      await waitForNextUpdate(); // First attempt
      await waitForNextUpdate(); // One retry allowed

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(error);
      expect(result.current.isError).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it("Should not run the query function when id is undefined", async () => {
      const { result, waitFor } = renderHook(() => useLiteUser(undefined), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockGetLiteUser).not.toHaveBeenCalled();
    });

    it("Should return cached data and not call getLiteUser again if data is fresh", async () => {
      mockGetLiteUser.mockResolvedValueOnce(getLiteUser("1"));

      // Render the hook for the first time
      const { result, waitForNextUpdate, rerender } = renderHook(
        () => useLiteUser(1),
        {
          wrapper,
        }
      );

      // Wait for the initial hook to load the data
      await waitForNextUpdate();

      // Check that the hook has the expected data and `getLiteUser` was called
      expect(result.current.data).toEqual(mockLiteUsers[0]);
      expect(mockGetLiteUser).toHaveBeenCalledTimes(1);

      // Rerender the hook with the same query key (should use cached data)
      rerender();

      // Ensure that `getLiteUser` is not called again, confirming cache usage
      expect(mockGetLiteUser).toHaveBeenCalledTimes(1); // No new fetch should occur
      expect(result.current.data).toEqual(mockLiteUsers[0]);
      expect(result.current.isFetching).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it("Should refetch data if it is stale", async () => {
      mockGetLiteUser.mockResolvedValueOnce(getLiteUser("2"));

      // Render the hook with the wrapper
      const { result, waitForNextUpdate, rerender } = renderHook(
        () => useLiteUser(2),
        { wrapper }
      );

      // Wait for the initial fetch to complete
      await waitForNextUpdate();

      // Confirm that initial data was loaded
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isStale).toBe(false);
      expect(result.current.data).toEqual(mockLiteUsers[1]);
      expect(mockGetLiteUser).toHaveBeenCalledTimes(1);

      // Mock a new response for the refetch
      mockGetLiteUser.mockResolvedValueOnce(getLiteUser("2"));

      // Invalidate the query to mark the data as stale
      queryClient.invalidateQueries(liteUserKey(2));

      // Trigger a rerender that should cause a refetch due to stale data
      rerender();

      // Confirm that initial data is marked as stale and refetching
      expect(result.current.isStale).toBe(true);
      expect(result.current.isRefetching).toBe(true);

      // Wait for the refetch to complete
      await waitForNextUpdate();

      // Confirm that the data has been updated after the refetch
      expect(result.current.isStale).toBe(false);
      expect(result.current.data).toEqual(mockLiteUsers[1]);
      expect(mockGetLiteUser).toHaveBeenCalledTimes(2);
    });

    it("Should use cached data if subsequent queries fail", async () => {
      mockGetLiteUser.mockResolvedValueOnce(getLiteUser("1"));

      // Render the hook with the wrapper
      const { result, waitForNextUpdate, rerender } = renderHook(
        () => useLiteUser(1),
        { wrapper }
      );

      // Wait for the initial fetch to complete
      await waitForNextUpdate();

      // Confirm that initial data was loaded
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isStale).toBe(false);
      expect(result.current.data).toEqual(mockLiteUsers[0]);
      expect(mockGetLiteUser).toHaveBeenCalledTimes(1);

      // Mock a new response for the refetch
      mockGetLiteUser.mockRejectedValue(new RpcError(500, "Some error", {}));

      // Invalidate the query to mark the data as stale
      queryClient.invalidateQueries(liteUserKey(1));

      // Trigger a rerender that should cause a refetch due to stale data
      rerender();

      // Confirm that initial data is marked as stale and refetching
      expect(result.current.isStale).toBe(true);
      expect(result.current.isRefetching).toBe(true);

      // Wait for the refetch to complete
      await waitForNextUpdate();
      await waitForNextUpdate();

      // Confirm that the stale data from cache has been returned and isError is true
      expect(result.current.isStale).toBe(true);
      expect(result.current.isError).toBe(true);
      expect(result.current.data).toEqual(mockLiteUsers[0]);
      expect(mockGetLiteUser).toHaveBeenCalledTimes(3);
    });
  });
});
