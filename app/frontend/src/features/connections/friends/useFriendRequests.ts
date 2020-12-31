import { Error } from "grpc-web";
import { useQuery } from "react-query";
import useUsers from "../../userQueries/useUsers";
import { ListFriendRequestsRes } from "../../../pb/api_pb";
import { service } from "../../../service";

export default function useFriendRequests() {
  const {
    data: friendRequestsData,
    isLoading: isFriendReqLoading,
    error,
  } = useQuery<ListFriendRequestsRes.AsObject, Error>(
    "friendRequests",
    service.api.listFriendRequests
  );

  const friendRequestLists =
    (friendRequestsData && friendRequestsData.sentList) ?? [];

  const {
    data: usersData,
    isLoading: isUsersLoading,
    errors: usersErrors,
  } = useUsers(friendRequestLists.map((friendReq) => friendReq.userId));

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
