import { useQuery } from "@tanstack/react-query";
import Sentry from "platform/sentry";

export interface WeblateLanguage {
  code: string;
  name: string;
  translated_percent: number;
}

export const fetchWeblateStats = async (): Promise<WeblateLanguage[]> => {
  try {
    const response = await fetch("https://cdn.couchers.org/api/projects/couchers/languages/", {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      Sentry.captureException(new Error(`Weblate API error: ${response.status} ${response.statusText}`));
      throw new Error(`Weblate API error: ${response.status} ${response.statusText}`);
    }

    const languages: WeblateLanguage[] = await response.json();
    return languages || [];
  } catch (error) {
    console.error("Error fetching Weblate stats:", error);
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
