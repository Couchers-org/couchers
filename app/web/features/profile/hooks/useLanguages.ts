import { useQuery } from "@tanstack/react-query";
import { languagesKey } from "features/queryKeys";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { service } from "service";

export function disambiguateDuplicateNames(
  namesByCode: Record<string, string>,
  format: (name: string, code: string) => string,
): Record<string, string> {
  const counts = new Map<string, number>();
  for (const name of Object.values(namesByCode)) {
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return Object.fromEntries(
    Object.entries(namesByCode).map(([code, name]) => [code, (counts.get(name) ?? 0) > 1 ? format(name, code) : name]),
  );
}

export const useLanguages = () => {
  const { t, i18n } = useTranslation(GLOBAL);
  const locale = i18n.language;
  const { data: rawLanguages, ...rest } = useQuery({
    queryKey: [languagesKey, locale],
    queryFn: () =>
      service.resources
        .getLanguages()
        .then((result) => Object.fromEntries(result.languagesList.map(({ code, name }) => [code, name]))),
  });

  const languages = rawLanguages
    ? disambiguateDuplicateNames(rawLanguages, (name, code) => t("ambiguous_language_name", { name, code }))
    : rawLanguages;

  return { languages, ...rest };
};
