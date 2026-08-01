import { useInfiniteQuery } from "@tanstack/react-query";
import { ListUserCommunitiesRes } from "couchers/proto/communities_pb";
import { userCommunitiesKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { service } from "service";

export default function useUserCommunities({
  pageSize,
}: {
  pageSize?: number;
}) {
  return useInfiniteQuery<ListUserCommunitiesRes.AsObject, RpcError>({
    queryKey: [userCommunitiesKey, pageSize],
    queryFn: ({ pageParam }) => {
      return service.communities.listUserCommunities(
        pageParam as string | undefined,
        pageSize,
      );
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
    staleTime: 10 * 60 * 1000,
  });
}
