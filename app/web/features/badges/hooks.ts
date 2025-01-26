import { badgesKey, badgeUsersKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { ListBadgeUsersRes } from "proto/api_pb";
import { Badge } from "proto/resources_pb";
import { useInfiniteQuery, useQuery } from "react-query";
import { service } from "service";

export const useBadges = () => {
  const { data, ...rest } = useQuery(badgesKey, async () => {
    const result = await service.resources.getBadges();
    return result.badgesList.reduce(
      (badgesResult, badge) => {
        badgesResult.badges[badge.id] = badge;
        return badgesResult;
      },
      {
        badges: {} as { [id: string]: Badge.AsObject },
      },
    );
  });

  return {
    badges: data?.badges,
    ...rest,
  };
};

export function useBadgeUsers(badgeId: string) {
  const query = useInfiniteQuery<ListBadgeUsersRes.AsObject, RpcError>({
    queryKey: badgeUsersKey({ badgeId }),
    queryFn: ({ pageParam }) =>
      service.api.listBadgeUsers({ badgeId, pageToken: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
  });
  const badgeUserIds = query.data?.pages.flatMap((res) => res.userIdsList);
  return {
    ...query,
    badgeUserIds,
  };
}
