import { Error } from "grpc-web";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "react-query";
import { User } from "../../pb/api_pb";
import { service } from "../../service";
import { userStaleTime } from "./useUsers";

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
  });

  const queryClient = useQueryClient();
  useEffect(() => {
    if (invalidate && usernameQuery.data) {
      queryClient.invalidateQueries(["user", usernameQuery.data.userId]);
    }
  }, [invalidate, queryClient, usernameQuery.data]);

  const query = useQuery<User.AsObject, Error>({
    queryKey: ["user", usernameQuery.data?.userId],
    queryFn: () =>
      service.user.getUser(usernameQuery.data?.userId.toString() || ""),
    staleTime: userStaleTime,
    enabled: !!usernameQuery.data,
  });

  const errors = [
    usernameQuery.error?.message || "",
    query.error?.message || "",
  ].join("\n");
  const isLoading = usernameQuery.isLoading || query.isLoading;
  const isError = usernameQuery.isError || query.isError;

  return {
    isLoading,
    isError,
    errors,
    data: query.data,
  };
}
