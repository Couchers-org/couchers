import { languagesKey } from "queryKeys";
import { useQuery } from "react-query";
import { service } from "service";

export const useLanguages = () => {
  const languagesQuery = useQuery(languagesKey, () =>
    service.resources.getLanguages()
  );

  return languagesQuery;
};
