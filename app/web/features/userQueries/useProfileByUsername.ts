import { useQuery, useQueryClient } from "@tanstack/react-query";
import { reactQueryRetries } from "appConstants";
import { profileKey, username2Id } from "features/queryKeys";
import { username2IdStaleTime, userStaleTime } from "features/userQueries/constants";
import { RpcError, StatusCode } from "grpc-web";
import { Profile } from "proto/api_pb";
import { useEffect } from "react";
import { service } from "service";

export default function useProfileByUsername(username: string, invalidate = false) {
  //We look up the userId first from the username, mirroring useUserByUsername.
  //This shares the username2Id cache entry with it, so it's not an extra query in practice.
  const usernameQuery = useQuery<{ username: string; userId: number }, RpcError>({
    gcTime: username2IdStaleTime,
    queryFn: async () => {
      const user = await service.user.getUser(username);
      return {
        userId: user.userId,
        username: user.username,
      };
    },
    queryKey: [username2Id, username],
    retry: (failureCount, error) => {
      //don't retry if the user isn't found
      return error.code !== StatusCode.NOT_FOUND && failureCount <= reactQueryRetries;
    },
    staleTime: username2IdStaleTime,
    enabled: !!username,
  });

  const queryClient = useQueryClient();
  useEffect(() => {
    if (invalidate && usernameQuery.data?.userId) {
      queryClient.invalidateQueries({
        queryKey: profileKey(usernameQuery.data.userId),
      });
    }
  }, [invalidate, queryClient, usernameQuery.data?.userId]);

  const query = useQuery<Profile.AsObject, RpcError>({
    enabled: !!usernameQuery.data,
    queryFn: () => service.user.getProfile(usernameQuery.data?.userId.toString() || ""),
    queryKey: profileKey(usernameQuery.data?.userId ?? 0),
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
