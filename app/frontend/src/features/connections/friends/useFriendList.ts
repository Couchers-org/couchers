import { useQuery, useQueries, UseQueryResult } from "react-query";
import { service } from "../../../service";

function useFriendList() {
  const { data: friendIds, error, isLoading, isError } = useQuery<
    number[],
    Error
  >("friendIds", service.api.listFriends);

  const friendQueries = useQueries(
    (friendIds ?? []).map((friendId) => {
      return {
        queryKey: ["user", friendId],
        queryFn: () => service.user.getUser(friendId.toString()),
        enabled: !!friendIds,
      };
    })
  );

  const hasErrors = isError || friendQueries.every((query) => query.isError);
  let errors: string[] = [];
  if (hasErrors) {
    if (friendQueries.length > 0) {
      // the friend/individual user query started fetching, so error must have happened here
      // as they won't fetch before `friendIds` have succeeded
      errors = friendQueries.reduce(
        (errors, query: UseQueryResult<unknown, Error>) => {
          if (query.error && query.error.message)
            errors.push(query.error.message);
          return errors;
        },
        errors
      );
    } else {
      errors = error && error.message ? [error.message] : [];
    }
  }

  return {
    isLoading: isLoading || friendQueries.some((query) => query.isLoading),
    isError: isError || friendQueries.every((query) => query.isError),
    errors,
    friendQueries,
  };
}

export default useFriendList;
