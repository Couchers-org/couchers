import {
  InfiniteData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { ListBadgeUsersRes } from "couchers/proto/api_pb";
import { Badge } from "couchers/proto/resources_pb";
import { badgesKey, badgeUsersKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { service } from "service";

// Badge definitions are platform-wide static metadata that change only when
// devs add new badges — cache them for the session lifetime.
const BADGES_STALE_TIME = Infinity;

export const useBadges = () => {
  const { data, ...rest } = useQuery({
    queryKey: [badgesKey],
    queryFn: async () => {
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
    },
    staleTime: BADGES_STALE_TIME,
  });

  return {
    badges: data?.badges,
    ...rest,
  };
};

export function useBadgeUsers(badgeId: string) {
  const query = useInfiniteQuery<
    ListBadgeUsersRes.AsObject,
    RpcError,
    InfiniteData<ListBadgeUsersRes.AsObject>,
    string[],
    string
  >({
    queryKey: badgeUsersKey({ badgeId }),
    queryFn: ({ pageParam }) =>
      service.api.listBadgeUsers({ badgeId, pageToken: pageParam }),
    initialPageParam: "0",
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
  });
  const badgeUserIds = query.data?.pages.flatMap((res) => res.userIdsList);
  return {
    ...query,
    badgeUserIds,
  };
}
