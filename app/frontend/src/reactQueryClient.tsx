import React from "react";
import {
  QueryClient,
  QueryClientProvider,
  UseQueryOptions,
  UseQueryResult,
} from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";

import { reactQueryRetries } from "./constants";

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

// export const OFFLINE_CACHE_KEY = "couchersOfflineCache";
// const persistor = createLocalStoragePersistor({
//   localStorageKey: OFFLINE_CACHE_KEY,
// });

// persistQueryClient({
//   maxAge: 14 * 24 * 60 * 60 * 1000,
//   persistor,
//   queryClient,
// });
interface ReactQueryClientProviderProps {
  children: React.ReactNode;
}

export function ReactQueryClientProvider({
  children,
}: ReactQueryClientProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
declare module "react-query" {
  export function useQueries<
    TData = unknown,
    TError = unknown,
    TQueryFnData = TData
  >(
    queries: UseQueryOptions<TData, TError, TQueryFnData>[]
  ): UseQueryResult<TData, TError>[];
}
