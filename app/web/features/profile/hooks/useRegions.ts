import { useQuery } from "@tanstack/react-query";
import { regionsKey } from "features/queryKeys";
import { service } from "service";

export const useRegions = () => {
  const { data: regions, ...rest } = useQuery({
    queryKey: [regionsKey],
    queryFn: () =>
      service.resources
        .getRegions()
        .then((result) =>
          Object.fromEntries(
            result.regionsList.map(({ alpha3, name }) => [alpha3, name]),
          ),
        ),
  });

  return { regions, ...rest };
};
