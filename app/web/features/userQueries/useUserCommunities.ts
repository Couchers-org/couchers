import { useInfiniteQuery } from "@tanstack/react-query";
import { RpcError } from "grpc-web";

import { userCommunitiesKey } from "@/features/queryKeys";
import { ListUserCommunitiesRes } from "@/proto/communities_pb";
import { service } from "@/service";

export default function useUserCommunities() {
  return useInfiniteQuery<ListUserCommunitiesRes.AsObject, RpcError>({
    queryKey: [userCommunitiesKey],
    queryFn: ({ pageParam }) => {
      return service.communities.listUserCommunities(
        pageParam as string | undefined,
      );
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
  });
}
