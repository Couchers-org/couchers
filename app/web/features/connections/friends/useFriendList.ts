import { useLiteUsersList } from "features/userQueries/useLiteUsers";
import { useQuery } from "react-query";
import { service } from "service";

function useFriendList() {
  const errors = [];

  const {
    data: friendIds,
    error: listFriendsError,
    isLoading,
  } = useQuery<number[], Error>("friendIds", service.api.listFriends);

  if (listFriendsError) {
    errors.push(listFriendsError.message);
  }

  const {
    data,
    isLoading: isLiteUsersLoading,
    isError: isLiteUserError,
    error: liteUserError,
  } = useLiteUsersList(friendIds || []);

  if (liteUserError) {
    errors.push(liteUserError.message);
  }

  return {
    data: friendIds ? data : undefined,
    friendIds,
    errors: errors,
    isError: !!listFriendsError || isLiteUserError,
    isLoading: isLoading || isLiteUsersLoading,
  };
}

export default useFriendList;
