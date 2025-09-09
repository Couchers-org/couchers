import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RpcError, StatusCode } from "grpc-web";
import { useEffect } from "react";

import { reactQueryRetries } from "@/appConstants";
import { USERNAME_2_ID, userKey } from "@/features/queryKeys";
import {
  USERNAME_2_ID_STALE_TIME,
  USER_STALE_TIME,
} from "@/features/userQueries/constants";
import { User } from "@/proto/api_pb";
import { service } from "@/service";

const useUserByUsername = (username: string, invalidate = false) => {
  // We look up the userId first from the username.
  // This causes a duplicate query, but it is not made stale for a long time
  // and ensures no duplication of users in the queryCache.
  const usernameQuery = useQuery<
    { username: string; userId: number },
    RpcError
  >({
    gcTime: USERNAME_2_ID_STALE_TIME,
    queryFn: async () => {
      const user = await service.user.getUser(username);
      return {
        userId: user.userId,
        username: user.username,
      };
    },
    queryKey: [USERNAME_2_ID, username],
    retry: (failureCount, error) => {
      // don't retry if the user isn't found
      return (
        error.code !== StatusCode.NOT_FOUND && failureCount <= reactQueryRetries
      );
    },
    staleTime: USERNAME_2_ID_STALE_TIME,
    enabled: !!username,
  });

  const queryClient = useQueryClient();
  useEffect(() => {
    if (invalidate && usernameQuery.data?.userId) {
      void queryClient.invalidateQueries({
        queryKey: userKey(usernameQuery.data.userId),
      });
    }
  }, [invalidate, queryClient, usernameQuery.data?.userId]);

  const query = useQuery<User.AsObject, RpcError>({
    enabled: !!usernameQuery.data,
    queryFn: () =>
      service.user.getUser(usernameQuery.data?.userId.toString() || ""),
    queryKey: userKey(usernameQuery.data?.userId ?? 0),
    staleTime: USER_STALE_TIME,
  });

  const errors = [];
  if (usernameQuery.error?.message) {
    errors.push(usernameQuery.error.message || "");
  }
  if (query.error?.message) {
    errors.push(query.error.message || "");
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
};

export default useUserByUsername;
