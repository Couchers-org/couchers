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
  const query = useQuery<GetLiteUsersRes.AsObject, RpcError>({
    queryKey: liteUsersKey(nonFalseyIds),
    queryFn: () => {
      const result = service.user.getLiteUsers(nonFalseyIds);
      return result;
    },
    staleTime: userStaleTime,
    enabled: nonFalseyIds.length > 0, // run only if there are valid liteUserIds
    retry: (failureCount, error) => {
      // don't retry if the user isn't found
      return (
        error.code !== StatusCode.NOT_FOUND && failureCount < reactQueryRetries
      );
    },
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

export { useLiteUser, useLiteUsers };
