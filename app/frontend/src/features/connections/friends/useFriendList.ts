import { Error } from "grpc-web";
import { User } from "pb/api_pb";
import { useQueries, useQuery, UseQueryResult } from "react-query";
import { service } from "service/index";

function useFriendList() {
  const { data: friendIds, error, isLoading } = useQuery<number[], Error>(
    "friendIds",
    service.api.listFriends
  );

  const friendQueries = useQueries<User.AsObject, Error>(
    (friendIds ?? []).map((friendId) => {
      return {
        enabled: !!friendIds,
        queryFn: () => service.user.getUser(friendId.toString()),
        queryKey: ["user", friendId],
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
