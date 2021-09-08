import { ListUserCommunitiesRes } from "couchers-core/src/proto/communities_pb";
import { service } from "couchers-core/dist/service";
import { Error as GrpcError } from "grpc-web";
import { userCommunitiesKey } from "queryKeys";
import { useInfiniteQuery } from "react-query";

export default function useUserCommunities() {
  return useInfiniteQuery<ListUserCommunitiesRes.AsObject, GrpcError>(
    userCommunitiesKey,
    ({ pageParam }) => service.communities.listUserCommunities(pageParam),
    {
      getNextPageParam: (lastPage) =>
        lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
    }
  );
}
