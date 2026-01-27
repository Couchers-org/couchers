import { useQuery, useQueryClient } from "@tanstack/react-query";
import { showAllLanguagesQueryKey } from "features/queryKeys";
import { useCallback } from "react";

const STORAGE_KEY = "showAllLanguages";

const isNonProduction =
  process.env.NEXT_PUBLIC_COUCHERS_ENV !== "prod" &&
  process.env.NODE_ENV !== "test";

/**
 * Hook to manage the "show all languages" setting for translators.
 * This setting is only available on non-production environments (stage/local dev).
 * When enabled, the language picker shows all languages regardless of translation completion percentage.
 */
export function useShowAllLanguages() {
  const queryClient = useQueryClient();

  const { data: showAllLanguages = false } = useQuery({
    queryKey: [showAllLanguagesQueryKey],
    queryFn: () => {
      if (typeof window === "undefined" || !isNonProduction) return false;
      return localStorage.getItem(STORAGE_KEY) === "true";
    },
    staleTime: Infinity,
  });

  const setShowAllLanguages = useCallback(
    (value: boolean) => {
      if (!isNonProduction) return;

      localStorage.setItem(STORAGE_KEY, String(value));
      queryClient.setQueryData([showAllLanguagesQueryKey], value);
    },
    [queryClient],
  );

  return {
    /** Whether the feature is available (non-production environment) */
    isAvailable: isNonProduction,
    /** Whether to show all languages in the picker */
    showAllLanguages: isNonProduction && showAllLanguages,
    /** Set the setting to a specific value */
    setShowAllLanguages,
  };
}
