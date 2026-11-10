import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { reactQueryRetries } from "appConstants";
import { del, get, set } from "idb-keyval";
import { useEffect } from "react";

interface ReactQueryClientProviderProps {
  children: React.ReactNode;
}

const CACHE_MAX_AGE = 14 * 24 * 60 * 60 * 1000;

const queryClient = new QueryClient({
  //grpc-web has built in timeout, so better not use the default exponential backoff
  defaultOptions: {
    queries: {
      // Unused queries are dropped from the persisted cache after gcTime, so keep them as long as maxAge for offline use
      gcTime: CACHE_MAX_AGE,
      refetchOnWindowFocus: false,
      retry: reactQueryRetries,
      retryDelay: 0,
    },
  },
});

// IndexedDB rather than localStorage, which is capped at ~5MB
const persister = createAsyncStoragePersister({
  storage:
    typeof window === "undefined"
      ? undefined
      : {
          getItem: (key) => get<string>(key),
          setItem: set,
          removeItem: del,
        },
  throttleTime: 100,
});

export function ReactQueryClientProvider({ children }: ReactQueryClientProviderProps) {
  useEffect(() => {
    // The cache used to be persisted to localStorage
    localStorage.removeItem("REACT_QUERY_OFFLINE_CACHE");
  }, []);

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: CACHE_MAX_AGE }}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </PersistQueryClientProvider>
  );
}
