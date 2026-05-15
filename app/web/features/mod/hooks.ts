import {
  InfiniteData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import {
  modUserDetailsKey,
  modUserKey,
  newUsersListKey,
} from "features/queryKeys";
import { userStaleTime } from "features/userQueries/constants";
import { RpcError } from "grpc-web";
import { ListUserIdsRes, UserDetails } from "proto/admin_pb";
import { Profile, User } from "proto/api_pb";
import { service } from "service";

export const useNewUsers = () => {
  const query = useInfiniteQuery<
    ListUserIdsRes.AsObject,
    RpcError,
    InfiniteData<ListUserIdsRes.AsObject>,
    [typeof newUsersListKey],
    string
  >({
    queryKey: [newUsersListKey],
    queryFn: ({ pageParam }) =>
      service.admin.listUserIds({
        startTime: new Date(1970, 0, 0, 0, 0, 1),
        endTime: new Date(2050, 0, 0),
        pageSize: 50,
        pageToken: pageParam,
      }),
    initialPageParam: "0",
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    refetchInterval: 60_000,
  });
  const userIds = query.data?.pages.flatMap((page) => page.userIdsList);
  return { ...query, userIds };
};

export default function useUserWithDetails(user: string) {
  const query = useQuery<User.AsObject, RpcError>({
    queryFn: () => service.admin.getUser(user),
    queryKey: [modUserKey(user)],
    staleTime: userStaleTime,
  });

  const profileQuery = useQuery<Profile.AsObject, RpcError>({
    queryFn: () => service.admin.getProfile(user),
    queryKey: ["modProfile", user],
    staleTime: userStaleTime,
  });

  const detailsQuery = useQuery<UserDetails.AsObject, RpcError>({
    queryFn: () => service.admin.getUserDetails(user),
    queryKey: [modUserDetailsKey(user)],
    staleTime: userStaleTime,
  });

  const errors = [];
  if (query.error?.message) {
    errors.push(query.error?.message || "");
  }
  if (profileQuery.error?.message) {
    errors.push(profileQuery.error?.message || "");
  }
  if (detailsQuery.error?.message) {
    errors.push(detailsQuery.error?.message || "");
  }

  const error = errors.join("\n");
  const isLoading =
    query.isLoading || profileQuery.isLoading || detailsQuery.isLoading;
  const isFetching =
    query.isFetching || profileQuery.isFetching || detailsQuery.isFetching;
  const isError =
    query.isError || profileQuery.isError || detailsQuery.isError;

  return {
    user: query.data,
    profile: profileQuery.data,
    userDetails: detailsQuery.data,
    error,
    isError,
    isFetching,
    isLoading,
  };
}
