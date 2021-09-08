import { FriendRequest } from "couchers-core/src/proto/api_pb";
import { service } from "couchers-core/dist/service";
import useUsers from "features/userQueries/useUsers";
import { Error } from "grpc-web";
import { friendRequestKey, FriendRequestType } from "queryKeys";
import { useQuery } from "react-query";

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
    data: usersData,
    isLoading: isUsersLoading,
    errors: usersErrors,
  } = useUsers(userIds);

  const errors = error ? [error.message, ...usersErrors] : usersErrors;

  const isLoading = isFriendReqLoading || isUsersLoading;

  const data =
    !isLoading && usersData
      ? (friendRequestLists ?? []).map((friendRequest) => ({
          ...friendRequest,
          friend: usersData.get(friendRequest.userId),
        }))
      : void 0;

  return {
    data,
    errors,
    isError: !!errors.length,
    isLoading,
  };
}
