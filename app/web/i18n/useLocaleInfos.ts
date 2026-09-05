import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { getLocaleInfos } from "./locales";
import { fetchWeblateLanguages } from "./weblate";

export function useLocaleInfos() {
  const { data: weblateLanguages, ...rest } = useQuery({
    queryKey: ["weblate-stats"],
    queryFn: () => fetchWeblateLanguages(),
    staleTime: 10 * 60 * 1000, // 10 minutes - data considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache persists
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const data = useMemo(() => getLocaleInfos(weblateLanguages ?? []), [weblateLanguages]);

  return { data, ...rest };
}
