import { useQuery } from "@tanstack/react-query";
import { languagesKey } from "features/queryKeys";
import { service } from "service";

export const useLanguages = () => {
  const { data: languages, ...rest } = useQuery({
    queryKey: [languagesKey],
    queryFn: () =>
      service.resources
        .getLanguages()
        .then((result) =>
          Object.fromEntries(
            result.languagesList.map(({ code, name }) => [code, name]),
          ),
        ),
  });

  return { languages, ...rest };
};
