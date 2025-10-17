import { ListUserIdsRes, UserDetails } from "@couchers/services/admin";
import { User } from "@couchers/services/api";
import {
  InfiniteData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { RpcError } from "grpc-web";

import {
  NEW_USERS_LIST_KEY,
  modUserDetailsKey,
  modUserKey,
} from "@/features/queryKeys";
import { USER_STALE_TIME } from "@/features/userQueries/constants";
import { service } from "@/service";

export const useNewUsers = () => {
  const query = useInfiniteQuery<
    ListUserIdsRes.AsObject,
    RpcError,
    InfiniteData<ListUserIdsRes.AsObject>,
    [typeof NEW_USERS_LIST_KEY],
    string
  >({
    queryKey: [NEW_USERS_LIST_KEY],
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

const useUserWithDetails = (user: string) => {
  const query = useQuery<User.AsObject, RpcError>({
    queryFn: () => service.admin.getUser(user),
    queryKey: [modUserKey(user)],
    staleTime: USER_STALE_TIME,
  });

  const detailsQuery = useQuery<UserDetails.AsObject, RpcError>({
    queryFn: () => service.admin.getUserDetails(user),
    queryKey: [modUserDetailsKey(user)],
    staleTime: USER_STALE_TIME,
  });

  const errors = [];
  if (query.error?.message) {
    errors.push(query.error.message || "");
  }
  if (detailsQuery.error?.message) {
    errors.push(detailsQuery.error.message || "");
  }

  const error = errors.join("\n");
  const isLoading = query.isLoading || detailsQuery.isLoading;
  const isFetching = query.isFetching || detailsQuery.isFetching;
  const isError = query.isError || detailsQuery.isError;

  return {
    user: query.data,
    userDetails: detailsQuery.data,
    error,
    isError,
    isFetching,
    isLoading,
  };
};

export default useUserWithDetails;
