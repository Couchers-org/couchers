import { act, renderHook } from "@testing-library/react-hooks";
import useRespondToFriendRequest from "features/connections/friends/useRespondToFriendRequest";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { FriendRequest } from "proto/api_pb";
import { friendRequestKey } from "queryKeys";
import { service } from "service";
import { getHookWrapperWithClient } from "test/hookWrapper";

const respondToFriendRequestMock = service.api
  .respondFriendRequest as jest.Mock<
  ReturnType<typeof service.api.respondFriendRequest>
>;

const { client, wrapper } = getHookWrapperWithClient();

afterEach(() => {
  client.clear();
  jest.restoreAllMocks();
});

describe("useRespondToFriendRequest hook", () => {
  const setMutationError = jest.fn();

  beforeEach(() => {
    client.setQueryData<FriendRequest.AsObject[]>(friendRequestKey("sent"), [
      {
        friendRequestId: 1,
        state: 0,
        userId: 2,
        sent: false,
      },
    ]);
    client.setQueryData<FriendRequest.AsObject[]>(
      friendRequestKey("received"),
      []
    );
    client.setQueryData<number[]>("friendIds", []);
  });

  it("invalidates the friend request received list and the friend list if the mutation succeeded", async () => {
    respondToFriendRequestMock.mockResolvedValue(new Empty());
    const { result, waitForNextUpdate } = renderHook(
      () => useRespondToFriendRequest(),
      {
        wrapper,
      }
    );
    act(() => {
      result.current.respondToFriendRequest({
        accept: true,
        friendRequest: {
          friendRequestId: 1,
          state: 0,
          userId: 2,
          sent: false,
        },
        setMutationError,
      });
    });
    await waitForNextUpdate();

    expect(setMutationError).toHaveBeenCalledTimes(1);
    expect(setMutationError).toHaveBeenCalledWith("");
    expect(client.getQueryState("friendIds")?.isInvalidated).toBe(true);
    expect(
      client.getQueryState(friendRequestKey("received"))?.isInvalidated
    ).toBe(true);
  });

  it("does not invalidate existing queries if the API call failed", async () => {
    respondToFriendRequestMock.mockRejectedValue(new Error("API error"));
    jest.spyOn(console, "error").mockReturnValue(undefined);

    const { result, waitForNextUpdate } = renderHook(
      () => useRespondToFriendRequest(),
      {
        wrapper,
      }
    );
    act(() => {
      result.current.respondToFriendRequest({
        accept: true,
        friendRequest: {
          friendRequestId: 1,
          state: 0,
          userId: 2,
          sent: false,
        },
        setMutationError,
      });
    });
    await waitForNextUpdate();

    expect(setMutationError).toHaveBeenCalledTimes(2);
    expect(setMutationError).toHaveBeenLastCalledWith("API error");
    expect(client.getQueryState("friendIds")?.isInvalidated).toBe(false);
    expect(
      client.getQueryState(friendRequestKey("received"))?.isInvalidated
    ).toBe(false);
  });
});
