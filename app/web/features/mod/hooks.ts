import { newUsersListKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { ListUserIdsRes } from "proto/admin_pb";
import { useInfiniteQuery } from "react-query";
import { service } from "service";

export const useNewUsers = () => {
  const query = useInfiniteQuery<ListUserIdsRes.AsObject, RpcError>(
    newUsersListKey,
    ({ pageParam }) =>
      service.admin.listUserIds({
        startTime: new Date(1970, 1, 1),
        endTime: new Date(),
        pageToken: pageParam,
      }),
    {
      getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
      refetchInterval: 60_000,
    },
  );
  const userIds = query.data?.pages.flatMap((page) => page.userIdsList);
  console.log(userIds);
  return { ...query, userIds };
};
