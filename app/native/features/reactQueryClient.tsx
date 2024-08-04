import AsyncStorage from "@react-native-async-storage/async-storage";
import { reactQueryRetries } from "appConstants";
import { useEffect } from "react";
import {
  QueryClient,
  QueryClientProvider,
  UseQueryOptions,
  UseQueryResult,
} from "react-query";
import { createAsyncStoragePersistor } from "react-query/createAsyncStoragePersistor-experimental";
import { ReactQueryDevtools } from "react-query/devtools";
import { persistQueryClient } from "react-query/persistQueryClient-experimental";

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
    const persistor = createAsyncStoragePersistor({
      storage: AsyncStorage,
      throttleTime: 100,
    });

    persistQueryClient({
      maxAge: 14 * 24 * 60 * 60 * 1000,
      persistor,
      queryClient,
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}
declare module "react-query" {
  export function useQueries<
    TData = unknown,
    TError = unknown,
    TQueryFnData = TData,
  >(
    queries: UseQueryOptions<TData, TError, TQueryFnData>[],
  ): UseQueryResult<TData, TError>[];
}
