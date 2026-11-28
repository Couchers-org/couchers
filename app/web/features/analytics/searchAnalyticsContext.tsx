import { createContext, ReactNode, useContext, useMemo } from "react";

import { getOrCreateSearchSessionId } from "./searchAttribution";

interface SearchAnalyticsValue {
  searchSessionId: string;
  searchQueryId: string;
  bfcSearchId: string | null;
  pageNumber: number;
}

const SearchAnalyticsContext = createContext<SearchAnalyticsValue | null>(null);

export function SearchAnalyticsProvider({
  children,
  searchQueryId,
  bfcSearchId,
  pageNumber,
}: {
  children: ReactNode;
  searchQueryId: string;
  bfcSearchId: string | null;
  pageNumber: number;
}) {
  const searchSessionId = useMemo(() => getOrCreateSearchSessionId(), []);
  const value = useMemo(
    () => ({ searchSessionId, searchQueryId, bfcSearchId, pageNumber }),
    [searchSessionId, searchQueryId, bfcSearchId, pageNumber],
  );
  return <SearchAnalyticsContext.Provider value={value}>{children}</SearchAnalyticsContext.Provider>;
}

export function useSearchAnalytics(): SearchAnalyticsValue | null {
  return useContext(SearchAnalyticsContext);
}
