import { reactQueryRetries } from "appConstants";
import { liteUserKey, liteUsersKey } from "features/queryKeys";
import { RpcError, StatusCode } from "grpc-web";
import { GetLiteUsersRes, LiteUser } from "proto/api_pb";
import { useQuery } from "react-query";
import { service } from "service";

import { userStaleTime } from "./constants";

// React Query typically retains the last successful data until the next successful fetch
function useLiteUsers(ids: (number | undefined)[]) {
  const nonFalseyIds = ids?.filter((id): id is number => !!id);
  // remove duplicate IDs from this list
  const uniqueIds = Array.from(new Set(nonFalseyIds));
  const query = useQuery<GetLiteUsersRes.AsObject, RpcError>({
    queryKey: liteUsersKey(uniqueIds),
    queryFn: () => {
      const result = service.user.getLiteUsers(uniqueIds);
      return result;
    },
    staleTime: userStaleTime,
    enabled: uniqueIds.length > 0, // run only if there are valid userIds
  });

  const isDataUndefined = !query.data || !query.data.responsesList;
  const usersById =
    query.isLoading || isDataUndefined
      ? undefined
      : new Map(
          query?.data?.responsesList.map((response) => [
            response?.user?.userId,
            response.user,
          ])
        );

  return {
    ...query,
    data: usersById,
  };
}

// Like above, but returns users in a list of the same size in same order
function useLiteUsersList(ids: (number | undefined)[]) {
  const liteUsersMap = useLiteUsers(ids);
  const usersList = ids.map((id) => liteUsersMap.data?.get(id));
  return { ...liteUsersMap, usersById: liteUsersMap.data, data: usersList };
}

// React Query typically retains the last successful data until the next successful fetch
function useLiteUser(id: number | undefined) {
  const query = useQuery<LiteUser.AsObject, RpcError>({
    queryKey: liteUserKey(id),
    queryFn: () => service.user.getLiteUser(id?.toString() || ""),
    staleTime: userStaleTime,
    enabled: id !== undefined,
    retry: (failureCount, error) => {
      // don't retry if the user isn't found
      return (
        error.code !== StatusCode.NOT_FOUND && failureCount < reactQueryRetries
      );
    },
  });

  return query;
}

export { useLiteUser, useLiteUsers, useLiteUsersList };
