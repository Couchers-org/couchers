import { Error } from "grpc-web";
import { useQuery } from "react-query";
import useUsers from "../../userQueries/useUsers";
import { ListFriendRequestsRes } from "../../../pb/api_pb";
import { service } from "../../../service";

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
    isError: !!errors.length,
    isLoading,
    data,
    errors,
  };
}
