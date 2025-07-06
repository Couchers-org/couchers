import { useQuery } from "@tanstack/react-query";
import { friendIdsKey } from "features/queryKeys";
import { useLiteUsersList } from "features/userQueries/useLiteUsers";
import { service } from "service";

function useFriendList() {
  const errors = [];

  const {
    data: friendIds,
    error: listFriendsError,
    isLoading,
    refetch: refetchFriends,
  } = useQuery<number[], Error>(friendIdsKey, service.api.listFriends);

  if (listFriendsError) {
    errors.push(listFriendsError.message);
  }

  const {
    data,
    isLoading: isLiteUsersLoading,
    isError: isLiteUserError,
    error: liteUserError,
  } = useLiteUsersList(friendIds);

  if (liteUserError) {
    errors.push(liteUserError.message);
  }

  return {
    data: friendIds ? data : undefined,
    friendIds,
    errors: errors,
    isError: !!listFriendsError || isLiteUserError,
    isLoading: isLoading || isLiteUsersLoading,
    refetchFriends,
  };
}

export default useFriendList;
