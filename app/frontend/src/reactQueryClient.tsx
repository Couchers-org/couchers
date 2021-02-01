import React from "react";
import {
  QueryClient,
  QueryClientProvider,
  UseQueryOptions,
  UseQueryResult,
} from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import { persistWithLocalStorage } from "react-query/persist-localstorage-experimental";

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

persistWithLocalStorage(queryClient);
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
