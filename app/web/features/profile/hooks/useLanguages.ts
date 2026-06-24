import { useQuery } from "@tanstack/react-query";
import { languagesKey } from "features/queryKeys";
import { service } from "service";
import { useTranslation } from "i18n";

export const useLanguages = () => {
  const locale = useTranslation().i18n.language;
  const { data: languages, ...rest } = useQuery({
    queryKey: [languagesKey, locale],
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
