import { service } from "couchers-core/dist/service";
import { languagesKey } from "queryKeys";
import { useQuery } from "react-query";

export const useLanguages = () => {
  const { data: { languages, languagesLookup } = {}, ...rest } = useQuery(
    languagesKey,
    () =>
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
          }
        )
      )
  );

  return {
    languages,
    languagesLookup,
    ...rest,
  };
};
