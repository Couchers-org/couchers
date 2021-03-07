import { act, renderHook } from "@testing-library/react-hooks";
import useCancelFriendRequest from "features/connections/friends/useCancelFriendRequest";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { ListFriendRequestsRes } from "pb/api_pb";
import { service } from "service/index";
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
    client.setQueryData<ListFriendRequestsRes.AsObject>("friendRequestsSent", {
      receivedList: [],
      sentList: [
        {
          friendRequestId: 1,
          state: 0,
          userId: 2,
        },
      ],
    });
  });

  it("invalidates the friend request sent list if the mutation succeeded", async () => {
    cancelFriendRequestMock.mockResolvedValue(new Empty());

    const { result, waitForNextUpdate } = renderHook(
      () => useCancelFriendRequest(),
      {
        wrapper,
      }
    );
    act(() => {
      result.current.cancelFriendRequest({
        friendRequestId: 1,
        setMutationError,
        userId: 2,
      });
    });

    await waitForNextUpdate();
    expect(setMutationError).toHaveBeenCalledTimes(1);
    expect(setMutationError).toHaveBeenCalledWith("");
    expect(client.getQueryState("friendRequestsSent")?.isInvalidated).toBe(
      true
    );
  });

  it("does not invalidate existing queries if the API call failed", async () => {
    cancelFriendRequestMock.mockRejectedValue(new Error("API error"));
    jest.spyOn(console, "error").mockReturnValue(undefined);

    const { result, waitForNextUpdate } = renderHook(
      () => useCancelFriendRequest(),
      {
        wrapper,
      }
    );
    act(() => {
      result.current.cancelFriendRequest({
        friendRequestId: 1,
        setMutationError,
        userId: 2,
      });
    });

    await waitForNextUpdate();
    expect(setMutationError).toHaveBeenCalledTimes(2);
    expect(setMutationError).toHaveBeenLastCalledWith("API error");
    expect(client.getQueryState("friendRequestsSent")?.isInvalidated).toBe(
      false
    );
  });
});
