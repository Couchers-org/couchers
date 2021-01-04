import { Error, StatusCode } from "grpc-web";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "react-query";
import { reactQueryRetries } from "../../constants";
import { User } from "../../pb/api_pb";
import { service } from "../../service";
import { username2IdStaleTime, userStaleTime } from "./constants";

export default function useUserByUsername(
  username: string,
  invalidate: boolean = false
) {
  //We look up the userId first from the username.
  //This causes a duplicate query, but it is not made stale for a long time
  //and ensures no duplication of users in the queryCache.
  const usernameQuery = useQuery<{ username: string; userId: number }, Error>({
    queryKey: ["username2Id", username],
    queryFn: async () => {
      const user = await service.user.getUser(username);
      return { username: user.username, userId: user.userId };
    },
    staleTime: username2IdStaleTime,
    cacheTime: username2IdStaleTime,
    retry: (failureCount, error) => {
      //don't retry if the user isn't found
      return (
        error.code !== StatusCode.NOT_FOUND && failureCount <= reactQueryRetries
      );
    },
  });

  const queryClient = useQueryClient();
  useEffect(() => {
    if (invalidate && usernameQuery.data?.userId) {
      queryClient.invalidateQueries(["user", usernameQuery.data.userId]);
    }
  }, [invalidate, queryClient, usernameQuery.data?.userId]);

  const query = useQuery<User.AsObject, Error>({
    queryKey: ["user", usernameQuery.data?.userId],
    queryFn: () =>
      service.user.getUser(usernameQuery.data?.userId.toString() || ""),
    staleTime: userStaleTime,
    enabled: !!usernameQuery.data,
  });

  const errors = [];
  if (usernameQuery.error?.message) {
    errors.push(usernameQuery.error?.message || "");
  }
  if (query.error?.message) {
    errors.push(query.error?.message || "");
  }

  const error = errors.join("\n");
  const isLoading = usernameQuery.isLoading || query.isLoading;
  const isFetching = usernameQuery.isFetching || query.isFetching;
  const isError = usernameQuery.isError || query.isError;

  return {
    isLoading,
    isFetching,
    isError,
    error,
    data: query.data,
  };
}
