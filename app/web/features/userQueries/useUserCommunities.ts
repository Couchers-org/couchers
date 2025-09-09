import { useInfiniteQuery } from "@tanstack/react-query";
import { RpcError } from "grpc-web";

import { USER_COMMUNITIES_KEY } from "@/features/queryKeys";
import { ListUserCommunitiesRes } from "@/proto/communities_pb";
import { service } from "@/service";

const useUserCommunities = () => {
  return useInfiniteQuery<ListUserCommunitiesRes.AsObject, RpcError>({
    queryKey: [USER_COMMUNITIES_KEY],
    queryFn: ({ pageParam }) => {
      return service.communities.listUserCommunities(
        pageParam as string | undefined,
      );
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
  });
};

export default useUserCommunities;
