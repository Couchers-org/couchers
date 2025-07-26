import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { reactQueryRetries } from "appConstants";
import { useEffect } from "react";

export const queryClient = new QueryClient({
  //grpc-web has built in timeout, so better not use the default exponential backoff
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: reactQueryRetries,
      retryDelay: 0,
    },
  },
});

interface ReactQueryClientProviderProps {
  children: React.ReactNode;
}

export function ReactQueryClientProvider({
  children,
}: ReactQueryClientProviderProps) {
  useEffect(() => {
    const persister = createSyncStoragePersister({
      storage: localStorage,
      throttleTime: 100,
    });

    persistQueryClient({
      maxAge: 14 * 24 * 60 * 60 * 1000,
      persister,
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
// declare module "@tanstack/react-query" {
//   export function useQueries<
//     TData = unknown,
//     TError = unknown,
//     TQueryFnData = TData,
//   >(
//     queries: UseQueryOptions<TData, TError, TQueryFnData>[],
//   ): UseQueryResult<TData, TError>[];
// }
