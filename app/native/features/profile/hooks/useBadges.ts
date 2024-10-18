import { badgesKey } from "@/features/queryKeys";
import { Badge } from "@/proto/resources_pb";
import { useQuery } from "react-query";
import { service } from "@/service";

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
