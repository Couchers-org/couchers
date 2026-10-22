import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { reactQueryRetries } from "appConstants";
import { useEffect } from "react";

interface ReactQueryClientProviderProps {
  children: React.ReactNode;
}

const queryClient = new QueryClient({
  //grpc-web has built in timeout, so better not use the default exponential backoff
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: reactQueryRetries,
      retryDelay: 0,
    },
  },
});

export function ReactQueryClientProvider({ children }: ReactQueryClientProviderProps) {
  useEffect(() => {
    const asyncStoragePersister = createAsyncStoragePersister({
      storage: localStorage,
      throttleTime: 100,
    });

    persistQueryClient({
      maxAge: 14 * 24 * 60 * 60 * 1000,
      persister: asyncStoragePersister,
      queryClient,
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
