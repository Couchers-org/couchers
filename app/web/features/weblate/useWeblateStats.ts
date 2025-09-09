import { useQuery } from "@tanstack/react-query";

import log from "@/log";
import { Sentry } from "@/platform/sentry";

interface WeblateLanguage {
  code: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  translated_percent: number;
}

const fetchWeblateStats = async (): Promise<WeblateLanguage[]> => {
  try {
    // TODO(FB) Get rid of hard-coded URL
    const response = await fetch(
      "https://cdn.couchers.org/api/projects/couchers/languages/",
      {
        headers: {
          accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      Sentry.captureException(
        new Error(
          `Weblate API error: ${response.status} ${response.statusText}`,
        ),
      );
      throw new Error(
        `Weblate API error: ${response.status} ${response.statusText}`,
      );
    }

    const languages = ((await response.json()) || []) as WeblateLanguage[];
    return languages;
  } catch (error) {
    log.error("Error fetching Weblate stats:", error);
    return [];
  }
};

export const useWeblateStats = () => {
  return useQuery({
    queryKey: ["weblate-stats"],
    queryFn: () => fetchWeblateStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes - data considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache persists
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export type { WeblateLanguage };
