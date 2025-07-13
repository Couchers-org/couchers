import { useQuery } from "react-query";

interface WeblateLanguage {
  code: string;
  name: string;
  translated_percent: number;
}

const fetchWeblateStats = async (
  projectSlug: string = "couchers",
): Promise<WeblateLanguage[]> => {
  try {
    const url = `/api/weblate-stats?projectSlug=${encodeURIComponent(projectSlug)}`;
    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const languages: WeblateLanguage[] = await response.json();
    return languages || [];
  } catch (error) {
    console.error("Error fetching Weblate stats:", error);
    return [];
  }
};

export const useWeblateStats = (projectSlug: string = "couchers") => {
  return useQuery({
    queryKey: ["weblate-stats", projectSlug],
    queryFn: () => fetchWeblateStats(projectSlug),
    staleTime: 10 * 60 * 1000, // 10 minutes - data considered fresh
    cacheTime: 10 * 60 * 1000, // 10 minutes - cache persists
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export type { WeblateLanguage };
