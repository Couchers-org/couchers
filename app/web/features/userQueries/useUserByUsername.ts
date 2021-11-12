import { reactQueryRetries } from "appConstants";
import { userKey } from "features/queryKeys";
import {
  username2IdStaleTime,
  userStaleTime,
} from "features/userQueries/constants";
import { Error, StatusCode } from "grpc-web";
import { User } from "proto/api_pb";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "react-query";
import { service } from "service";

export default function useUserByUsername(
  username: string,
  invalidate: boolean = false
) {
  //We look up the userId first from the username.
  //This causes a duplicate query, but it is not made stale for a long time
  //and ensures no duplication of users in the queryCache.
  const usernameQuery = useQuery<{ username: string; userId: number }, Error>({
    cacheTime: username2IdStaleTime,
    queryFn: async () => {
      const user = await service.user.getUser(username);
      return {
        userId: user.userId,
        username: user.username,
      };
    },
    queryKey: ["username2Id", username],
    retry: (failureCount, error) => {
      //don't retry if the user isn't found
      return (
        error.code !== StatusCode.NOT_FOUND && failureCount <= reactQueryRetries
      );
    },
    staleTime: username2IdStaleTime,
  });

  const queryClient = useQueryClient();
  useEffect(() => {
    if (invalidate && usernameQuery.data?.userId) {
      queryClient.invalidateQueries(userKey(usernameQuery.data.userId));
    }
  }, [invalidate, queryClient, usernameQuery.data?.userId]);

  const query = useQuery<User.AsObject, Error>({
    enabled: !!usernameQuery.data,
    queryFn: () =>
      service.user.getUser(usernameQuery.data?.userId.toString() || ""),
    queryKey: userKey(usernameQuery.data?.userId ?? 0),
    staleTime: userStaleTime,
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
    data: query.data,
    error,
    isError,
    isFetching,
    isLoading,
  };
}
