import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";

import { userKey } from "@/features/queryKeys";
import { USER_STALE_TIME } from "@/features/userQueries/constants";
import { service } from "@/service";
import { arrayEq } from "@/utils/arrayEq";

const useUsers = (ids: (number | undefined)[], invalidate = false) => {
  const queryClient = useQueryClient();
  const idsRef = useRef(ids);
  const handleInvalidation = useCallback(() => {
    if (invalidate) {
      void queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === userKey()[0] &&
          idsRef.current.includes(query.queryKey[1] as number),
        // tells v5 to immediately refetch active observers after invalidation
        refetchType: "active",
      });
    }
  }, [invalidate, queryClient]);
  useEffect(() => {
    handleInvalidation();
  }, [handleInvalidation]);

  // arrays use reference equality, so you can't use ids in useEffect directly
  useEffect(() => {
    if (!arrayEq(idsRef.current, ids)) {
      idsRef.current = ids;
      handleInvalidation();
    }
  });

  const queries = useQueries({
    queries: ids
      .filter((id): id is number => !!id)
      .map((id) => ({
        queryFn: () => service.user.getUser(id.toString()),
        queryKey: userKey(id),
        staleTime: USER_STALE_TIME,
      })),
  });

  const errors = queries
    .map((query) =>
      query.error && typeof query.error.message === "string"
        ? query.error.message
        : undefined,
    )
    .filter((e): e is string => typeof e === "string");
  const isPending = queries.some((query) => query.isPending);
  const isFetching = queries.some((query) => query.isFetching);

  // If at least one user query is not loading (i.e. has data loaded before), whilst
  // some other (likely new) queries are fetching, then it's a refetch
  const isRefetching = !queries.every((query) => query.isLoading) && isFetching;
  const isError = !!errors.length;

  const usersById = isPending
    ? undefined
    : new Map(queries.map((q, index) => [ids[index], q.data]));

  return {
    data: usersById,
    errors,
    isError,
    isFetching,
    isLoading: isPending,
    isRefetching,
  };
};

export default useUsers;

export const useUser = (id: number | undefined, invalidate = false) => {
  const result = useUsers([id], invalidate);
  return {
    data: result.data?.get(id),
    error: result.errors.join("\n"),
    isError: result.isError,
    isFetching: result.isFetching,
    isLoading: result.isLoading,
  };
};
