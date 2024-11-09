import { friendRequestKey, FriendRequestType } from "features/queryKeys";
import { useLiteUsers } from "features/userQueries/useLiteUsers";
import { FriendRequest } from "proto/api_pb";
import { useQuery } from "react-query";
import { service } from "service";

export default function useFriendRequests(
  friendRequestType: FriendRequestType
) {
  const {
    data: friendRequestLists,
    isLoading: isFriendReqLoading,
    error,
  } = useQuery<FriendRequest.AsObject[], Error>(
    friendRequestKey(friendRequestType),
    async () => {
      const friendRequests = await service.api.listFriendRequests();
      return friendRequestType === "sent"
        ? friendRequests.sentList
        : friendRequests.receivedList;
    }
  );

  const userIds = (friendRequestLists ?? []).map(
    (friendReq) => friendReq.userId
  );

  const {
    data: liteUsersData,
    isLoading: isLiteUsersLoading,
    error: liteUserError,
  } = useLiteUsers(userIds);

  const errors = error
    ? [error.message, liteUserError?.message]
    : liteUserError?.message
    ? [liteUserError.message]
    : [];

  const isLoading = isFriendReqLoading || isLiteUsersLoading;

  const formattedFriendRequests = !liteUsersData
    ? []
    : (friendRequestLists ?? []).map((friendRequest) => ({
        ...friendRequest,
        friend: liteUsersData.get(friendRequest.userId),
      }));

  const data = !isLoading ? formattedFriendRequests : undefined;

  return {
    data,
    errors,
    isError: !!errors.length,
    isLoading,
  };
}
