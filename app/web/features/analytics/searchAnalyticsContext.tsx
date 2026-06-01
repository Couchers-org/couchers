import { createContext, ReactNode, useContext, useMemo } from "react";

import { getOrCreateSearchSessionId } from "./searchAttribution";

interface SearchAnalyticsValue {
  searchSessionId: string;
  searchQueryId: string;
  pageNumber: number;
}

const SearchAnalyticsContext = createContext<SearchAnalyticsValue | null>(null);

export function SearchAnalyticsProvider({
  children,
  searchQueryId,
  pageNumber,
}: {
  children: ReactNode;
  searchQueryId: string;
  pageNumber: number;
}) {
  const searchSessionId = useMemo(() => getOrCreateSearchSessionId(), []);
  const value = useMemo(
    () => ({ searchSessionId, searchQueryId, pageNumber }),
    [searchSessionId, searchQueryId, pageNumber],
  );
  return (
    <SearchAnalyticsContext.Provider value={value}>
      {children}
    </SearchAnalyticsContext.Provider>
  );
}

export function useSearchAnalytics(): SearchAnalyticsValue | null {
  return useContext(SearchAnalyticsContext);
}
