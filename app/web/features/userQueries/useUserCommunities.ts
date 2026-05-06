import { useInfiniteQuery } from "@tanstack/react-query";
import { userCommunitiesKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { ListUserCommunitiesRes } from "proto/communities_pb";
import { service } from "service";

export default function useUserCommunities({
  pageSize,
  orderLocalFirst,
}: {
  pageSize?: number;
  orderLocalFirst?: boolean;
}) {
  return useInfiniteQuery<ListUserCommunitiesRes.AsObject, RpcError>({
    queryKey: [userCommunitiesKey, pageSize, orderLocalFirst],
    queryFn: ({ pageParam }) => {
      return service.communities.listUserCommunities(
        pageParam as string | undefined,
        pageSize,
        orderLocalFirst,
      );
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
  });
}
