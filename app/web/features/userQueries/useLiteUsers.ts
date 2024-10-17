import { reactQueryRetries } from "appConstants";
import { liteUserKey, liteUsersKey } from "features/queryKeys";
import { RpcError, StatusCode } from "grpc-web";
import { GetLiteUsersRes, LiteUser } from "proto/api_pb";
import { useQuery } from "react-query";
import { service } from "service";

import { userStaleTime } from "./constants";

export default function useLiteUsers(ids: (number | undefined)[]) {
  const nonFalseyIds = ids?.filter((id): id is number => !!id);
  const query = useQuery<GetLiteUsersRes.AsObject, RpcError>({
    queryKey: liteUsersKey(nonFalseyIds),
    queryFn: () => service.user.getLiteUsers(nonFalseyIds),
    staleTime: userStaleTime,
    enabled: nonFalseyIds.length > 0, // run only if there are valid liteUserIds
  });

  const usersById =
    query.isLoading || query?.data?.responsesList === undefined
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

// should is returned when stale if subsequent refetch queries fail
export function useLiteUser(id: number | undefined) {
  const query = useQuery<LiteUser.AsObject, RpcError>({
    queryKey: liteUserKey(id),
    queryFn: () => service.user.getLiteUser(id?.toString() || ""),
    retry: (failureCount, error) => {
      //don't retry if the user isn't found
      return (
        error.code !== StatusCode.NOT_FOUND && failureCount <= reactQueryRetries
      );
    },
    staleTime: userStaleTime,
    enabled: !!id,
  });

  return query;
}
