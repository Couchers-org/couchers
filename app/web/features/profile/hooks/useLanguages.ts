import { useQuery } from "@tanstack/react-query";

import { LANGUAGES_KEY } from "@/features/queryKeys";
import { service } from "@/service";

export const useLanguages = () => {
  const { data: { languages, languagesLookup } = {}, ...rest } = useQuery({
    queryKey: [LANGUAGES_KEY],
    queryFn: () =>
      service.resources.getLanguages().then((result) =>
        result.languagesList.reduce(
          (languagesResult, { code, name }) => {
            languagesResult.languages[code] = name;
            languagesResult.languagesLookup[name] = code;
            return languagesResult;
          },
          {
            languages: {} as { [code: string]: string },
            languagesLookup: {} as { [name: string]: string },
          },
        ),
      ),
  });

  return {
    languages,
    languagesLookup,
    ...rest,
  };
};
