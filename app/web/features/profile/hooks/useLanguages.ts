import { useQuery } from "@tanstack/react-query";
import { languagesKey } from "features/queryKeys";
import { useTranslation } from "i18n";
import { service } from "service";

export const useLanguages = () => {
  const locale = useTranslation().i18n.language;
  const { data: languages, ...rest } = useQuery({
    queryKey: [languagesKey, locale],
    queryFn: () =>
      service.resources
        .getLanguages()
        .then((result) => Object.fromEntries(result.languagesList.map(({ code, name }) => [code, name]))),
  });

  return { languages, ...rest };
};
