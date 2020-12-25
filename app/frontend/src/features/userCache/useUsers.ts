import { Error } from "grpc-web";
import { useQueries, useQueryClient } from "react-query";
import { User } from "../../pb/api_pb";
import { service } from "../../service";

const userStaleTime = 10 * 60 * 1000;
const username2IdStaleTime = 30 * 24 * 60 * 60 * 1000;

export default function useUsers(
  users: (number | string)[],
  invalidate: boolean = false
) {
  const queryClient = useQueryClient();

  //first get the ids of the usernames. This is doubling up, but this query
  //doesn't become stale for a long time.
  const usernames = users.filter((u): u is string => typeof u === "string");
  const usernameQueries = useQueries<
    { username: string; userId: number },
    Error
  >(
    usernames.map((username) => ({
      queryKey: ["username2Id", username],
      queryFn: async () => {
        const user = await service.user.getUser(username);
        return { username: user.username, userId: user.userId };
      },
      staleTime: username2IdStaleTime,
      cacheTime: username2IdStaleTime,
    }))
  );

  //the query will only continue if all the ids of usernames are fetched
  const isUserIdsFetched = usernameQueries.every((query) => query.data?.userId);

  //filter only fetched ids from usernames, the query won't continue anyway
  //if not all are fetched yet
  const usernameIds = usernameQueries
    .map((q) => q.data?.userId)
    .filter((u): u is number => typeof u === "number");

  const ids = users
    .filter((u): u is number => typeof u === "number")
    .concat(usernameIds);

  if (invalidate && isUserIdsFetched) {
    queryClient.invalidateQueries({
      predicate: (query) =>
        query.queryKey[0] === "user" &&
        users.indexOf(query.queryKey[1] as number) > -1,
    });
  }

  const queries = useQueries<User.AsObject, Error>(
    ids.map((id) => ({
      queryKey: ["user", id],
      queryFn: () => service.user.getUser(id.toString()),
      staleTime: userStaleTime,
      enabled: isUserIdsFetched,
    }))
  );

  const errors = [
    usernameQueries
      .map((query) => query.error?.message)
      .filter((e): e is string => typeof e === "string"),
    ...queries
      .map((query) => query.error?.message)
      .filter((e): e is string => typeof e === "string"),
  ];

  const isLoading =
    queries.some((query) => query.isLoading) ||
    usernameQueries.some((query) => query.isLoading);
  const isError = !errors.length;

  const usersById = new Map(queries.map((q) => [q.data?.userId, q.data]));
  const usersByUsername = usernameQueries.map<
    [string | undefined, User.AsObject | undefined]
  >((q) => [
    q.data?.username,
    q.data ? usersById.get(q.data.userId) : undefined,
  ]);

  const allUsers = new Map<
    number | string | undefined,
    User.AsObject | undefined
  >([...Array.from(usersById), ...usersByUsername]);

  return {
    isLoading,
    isError,
    errors,
    users: allUsers,
  };
}
