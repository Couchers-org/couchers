import useUsers from "features/userQueries/useUsers";
import { Error } from "grpc-web";
import { ListFriendRequestsRes } from "pb/api_pb";
import { useQuery } from "react-query";
import { service } from "service/index";

export default function useFriendRequests(
  friendRequestType: "Sent" | "Received"
) {
  const {
    data: friendRequestsData,
    isLoading: isFriendReqLoading,
    error,
  } = useQuery<ListFriendRequestsRes.AsObject, Error>(
    `friendRequests${friendRequestType}`,
    service.api.listFriendRequests
  );

  const friendRequestLists = friendRequestsData
    ? friendRequestType === "Sent"
      ? friendRequestsData.sentList
      : friendRequestsData.receivedList
    : [];

  const userIds = friendRequestLists.map((friendReq) => friendReq.userId);

  const {
    data: usersData,
    isLoading: isUsersLoading,
    errors: usersErrors,
  } = useUsers(userIds);

  const errors = error ? [error.message, ...usersErrors] : usersErrors;

  const isLoading = isFriendReqLoading || isUsersLoading;

  const data =
    !isLoading && usersData
      ? friendRequestLists.map((friendRequest) => ({
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
