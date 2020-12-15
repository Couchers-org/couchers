import { Error } from "grpc-web";
import { useQuery, useQueries, UseQueryResult } from "react-query";
import { User } from "../../../pb/api_pb";
import { service } from "../../../service";

function useFriendList() {
  const { data: friendIds, error, isLoading, isError } = useQuery<
    number[],
    Error
  >("friendIds", service.api.listFriends);

  const friendQueries = useQueries<User.AsObject, Error>(
    (friendIds ?? []).map((friendId) => {
      return {
        queryKey: ["user", friendId],
        queryFn: () => service.user.getUser(friendId.toString()),
        enabled: !!friendIds,
      };
    })
  );

  const hasErrors = isError || friendQueries.every((query) => query.isError);
  const errors = [
    error?.message,
    ...friendQueries.map(
      (query: UseQueryResult<unknown, Error>) => query.error?.message
    ),
  ].filter((e): e is string => typeof e === "string");

  return {
    isLoading: isLoading || friendQueries.some((query) => query.isLoading),
    isError: hasErrors,
    errors,
    friendQueries,
  };
}

export default useFriendList;
