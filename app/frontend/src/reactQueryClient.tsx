import React from "react";
import { QueryClient, QueryClientProvider } from "react-query";
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
