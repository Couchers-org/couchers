import { useQuery } from "@tanstack/react-query";

import { FRIEND_IDS_KEY } from "@/features/queryKeys";
import { useLiteUsersList } from "@/features/userQueries/useLiteUsers";
import { service } from "@/service";

const useFriendList = () => {
  const errors = [];

  const {
    data: friendIds,
    error: listFriendsError,
    isLoading,
    refetch: refetchFriends,
  } = useQuery<number[]>({
    queryKey: [FRIEND_IDS_KEY],
    queryFn: service.api.listFriends,
  });

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
    errors,
    isError: !!listFriendsError || isLiteUserError,
    isLoading: isLoading || isLiteUsersLoading,
    refetchFriends,
  };
};

export default useFriendList;
