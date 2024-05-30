import { badgesKey, badgeUsersKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { ListBadgeUsersRes } from "proto/api_pb";
import { Badge } from "proto/resources_pb";
import { useInfiniteQuery, useQuery } from "react-query";
import { service } from "service";
import type { ListBadgeUsersInput } from "service/api";

export const useBadges = () => {
  const { data, ...rest } = useQuery(badgesKey, () =>
    service.resources.getBadges().then((result) =>
      result.badgesList.reduce(
        (badgesResult, badge) => {
          badgesResult.badges[badge.id] = badge;
          return badgesResult;
        },
        {
          badges: {} as { [id: string]: Badge.AsObject },
        }
      )
    )
  );

  return {
    badges: data?.badges,
    ...rest,
  };
};

export function useBadgeUsers({ badgeId, pageSize }: Omit<ListBadgeUsersInput, "pageToken">) {
  return useInfiniteQuery<ListBadgeUsersRes.AsObject, RpcError>({
    queryKey: badgeUsersKey,
    queryFn: ({ pageParam }) => service.api.listUserBadges({ badgeId, pageSize, pageToken: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextPageToken ?? undefined,
  });
}
