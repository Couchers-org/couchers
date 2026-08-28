import { useQuery } from "@tanstack/react-query";
import Sentry from "platform/sentry";

/** A language tracked by weblate (either the base English language or a translated language). */
export interface WeblateLanguage {
  /** The Weblate language code, based on ISO but using underscores, e.g. "pt_BR". */
  code: string;
  /** The English name of the language as reported by Weblate. */
  name: string;
  /** The progress percentage of the translation. */
  translated_percent: number;
}

/** Converts a Weblate language code (e.g. "pt_BR") to its ISO-style locale code (e.g. "pt-BR"). */
export function weblateToISOLocale(code: string): string {
  return code.replace("_", "-");
}

/** Queries Weblate for known languages and their translation progress. */
export async function fetchWeblateLanguages(): Promise<WeblateLanguage[]> {
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
}

export const useWeblateLanguages = () => {
  return useQuery({
    queryKey: ["weblate-stats"],
    queryFn: () => fetchWeblateLanguages(),
    staleTime: 10 * 60 * 1000, // 10 minutes - data considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache persists
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
