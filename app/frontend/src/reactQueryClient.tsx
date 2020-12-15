import React from "react";
import {
  UseQueryOptions,
  UseQueryResult,
  QueryClient,
  QueryClientProvider,
} from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import { persistWithLocalStorage } from "react-query/persist-localstorage-experimental";

export const queryClient = new QueryClient();

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
