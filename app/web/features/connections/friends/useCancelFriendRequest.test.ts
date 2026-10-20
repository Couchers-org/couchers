import { act, renderHook, waitFor } from "@testing-library/react";
import useCancelFriendRequest from "features/connections/friends/useCancelFriendRequest";
import { friendRequestKey } from "features/queryKeys";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { FriendRequest } from "proto/api_pb";
import { service } from "service";
import { getHookWrapperWithClient } from "test/hookWrapper";

const cancelFriendRequestMock = service.api.cancelFriendRequest as jest.Mock<
  ReturnType<typeof service.api.cancelFriendRequest>
>;

const { client, wrapper } = getHookWrapperWithClient();

afterEach(() => {
  client.clear();
  jest.restoreAllMocks();
});

describe("useCancelFriendRequest hook", () => {
  const setMutationError = jest.fn();

  beforeEach(() => {
    client.setQueryData<FriendRequest.AsObject[]>(friendRequestKey("sent"), [
      {
        friendRequestId: 1,
        state: 0,
        userId: 2,
        sent: true,
      },
    ]);
    client.setQueryData<FriendRequest.AsObject[]>(friendRequestKey("received"), []);
  });

  it("invalidates the friend request sent list if the mutation succeeded", async () => {
    cancelFriendRequestMock.mockResolvedValue(new Empty());

    const { result } = renderHook(() => useCancelFriendRequest(), {
      wrapper,
    });

    // Spy before triggering to observe the actual invalidate from onSuccess
    const spy = jest.spyOn(client, "invalidateQueries");

    act(() => {
      result.current.cancelFriendRequest({
        friendRequestId: 1,
        setMutationError,
        userId: 2,
      });
    });

    await waitFor(() => expect(setMutationError).toHaveBeenCalledTimes(1));
    expect(setMutationError).toHaveBeenCalledWith("");
    // assert that invalidateQueries was called on the expected key
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: friendRequestKey("sent"),
          exact: true,
        }),
      ),
    );
  });

  it("does not invalidate existing queries if the API call failed", async () => {
    cancelFriendRequestMock.mockRejectedValue(new Error("API error"));
    jest.spyOn(console, "error").mockReturnValue(undefined);

    const spy = jest.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useCancelFriendRequest(), {
      wrapper,
    });
    act(() => {
      result.current.cancelFriendRequest({
        friendRequestId: 1,
        setMutationError,
        userId: 2,
      });
    });

    await waitFor(() => expect(setMutationError).toHaveBeenCalledTimes(2));
    expect(setMutationError).toHaveBeenLastCalledWith("API error");
    // No invalidation expected; data remains in cache
    expect(client.getQueryData(friendRequestKey("sent"))).toBeDefined();
    expect(spy).not.toHaveBeenCalled();
  });
});
