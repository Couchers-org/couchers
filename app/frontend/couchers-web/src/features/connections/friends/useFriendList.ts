import { User } from "couchers-core/src/proto/api_pb";
import { service } from "couchers-core/dist/service";
import { Error } from "grpc-web";
import { userKey } from "queryKeys";
import { useQueries, useQuery, UseQueryResult } from "react-query";

function useFriendList() {
  const {
    data: friendIds,
    error,
    isLoading,
  } = useQuery<number[], Error>("friendIds", service.api.listFriends);

  const friendQueries = useQueries<User.AsObject, Error>(
    (friendIds ?? []).map((friendId) => {
      return {
        enabled: !!friendIds,
        queryFn: () => service.user.getUser(friendId.toString()),
        queryKey: userKey(friendId),
      };
    })
  );

  const errors = [
    error?.message,
    ...friendQueries.map(
      (query: UseQueryResult<unknown, Error>) => query.error?.message
    ),
  ].filter((e): e is string => typeof e === "string");
  const data = friendIds && friendQueries.map((query) => query.data);

  return {
    data,
    errors,
    isError: !!errors.length,
    isLoading: isLoading || friendQueries.some((query) => query.isLoading),
  };
}

export default useFriendList;
