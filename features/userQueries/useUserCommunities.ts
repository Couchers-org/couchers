import { userCommunitiesKey } from "features/queryKeys";
import { Error as GrpcError } from "grpc-web";
import { ListUserCommunitiesRes } from "proto/communities_pb";
import { useInfiniteQuery } from "react-query";
import { service } from "service";

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
