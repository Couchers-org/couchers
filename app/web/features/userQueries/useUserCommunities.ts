import { useInfiniteQuery } from "@tanstack/react-query";
import { userCommunitiesKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { ListUserCommunitiesRes } from "proto/communities_pb";
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
    // Community membership only changes when joining/leaving — those actions
    // invalidate this query, so there's no need to refetch on every page visit.
    staleTime: 10 * 60 * 1000,
  });
}
