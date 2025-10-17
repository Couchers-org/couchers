import { ListBadgeUsersRes } from "@couchers/services/api";
import { Badge } from "@couchers/services/resources";
import {
  InfiniteData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { RpcError } from "grpc-web";

import { BADGES_KEY, badgeUsersKey } from "@/features/queryKeys";
import { service } from "@/service";

export const useBadges = () => {
  const { data, ...rest } = useQuery({
    queryKey: [BADGES_KEY],
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
  });

  return {
    badges: data?.badges,
    ...rest,
  };
};

export const useBadgeUsers = (badgeId: string) => {
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
};
