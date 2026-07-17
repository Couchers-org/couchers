import { useQuery } from "@tanstack/react-query";
import { regionsKey } from "features/queryKeys";
import { useTranslation } from "i18n";
import { service } from "service";

export const useRegions = () => {
  const locale = useTranslation().i18n.language;
  const { data: regions, ...rest } = useQuery({
    queryKey: [regionsKey, locale],
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
