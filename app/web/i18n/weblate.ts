import { useQuery } from "@tanstack/react-query";
import Sentry from "platform/sentry";

/** Metadata about a Weblate language. */
export interface WeblateLanguage {
  /** ISO locale code. */
  locale: string;
  /** Translation progress between 0 and 1. */
  translationProgress: number;
}

// Stable reference so callers don't see a new array on every render while loading.
const NO_LANGUAGES: WeblateLanguage[] = [];

/** Gets the list of Weblate languages or an empty array while loading or on error. */
export function useWeblateLanguages() {
  const query = useQuery({
    queryKey: ["weblate-stats"],
    queryFn: () => fetchWeblateLanguages(),
    staleTime: 10 * 60 * 1000, // 10 minutes - data considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache persists
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  return { ...query, data: query.data ?? NO_LANGUAGES };
}

/** The shape of the response from the Weblate languages API. */
type LanguagesResponse = Array<{
  code: string;
  name: string;
  translated_percent: number;
}>;

/** Queries Weblate for known languages and their translation progress. */
async function fetchWeblateLanguages(): Promise<WeblateLanguage[]> {
  const response = await fetch("https://cdn.couchers.org/api/projects/couchers/languages/", {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const error = new Error(`Weblate API error: ${response.status} ${response.statusText}`);
    Sentry.captureException(error);
    throw error;
  }

  const entries = ((await response.json()) as LanguagesResponse) || [];
  // Map to friendlier type
  return entries.map((entry) => ({
    locale: weblateToISOLocale(entry.code),
    translationProgress: entry.translated_percent / 100,
  }));
}

/** Converts a Weblate language code (e.g. "pt_BR") to its ISO-style locale code (e.g. "pt-BR"). */
function weblateToISOLocale(code: string): string {
  return code.replace("_", "-");
}
