import { userKey } from "features/queryKeys";
import { userStaleTime } from "features/userQueries/constants";
import { Error } from "grpc-web";
import { User } from "proto/api_pb";
import { useCallback, useEffect, useRef } from "react";
import { useQueries, useQueryClient } from "react-query";
import { service } from "service";
import { arrayEq } from "utils/arrayEq";

export default function useUsers(
  ids: (number | undefined)[],
  invalidate: boolean = false
) {
  const queryClient = useQueryClient();
  const idsRef = useRef(ids);
  const handleInvalidation = useCallback(() => {
    if (invalidate) {
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === userKey() &&
          !!idsRef.current.includes(query.queryKey[1] as number),
      });
    }
  }, [invalidate, queryClient]);
  useEffect(() => {
    handleInvalidation();
  }, [handleInvalidation]);

  //arrays use reference equality, so you can't use ids in useEffect directly
  useEffect(() => {
    if (!arrayEq(idsRef.current, ids)) {
      idsRef.current = ids;
      handleInvalidation();
    }
  });

  const queries = useQueries<User.AsObject, Error>(
    ids
      .filter((id): id is number => !!id)
      .map((id) => ({
        queryFn: () => service.user.getUser(id.toString()),
        queryKey: userKey(id),
        staleTime: userStaleTime,
      }))
  );

  const errors = queries
    .map((query) => query.error?.message)
    .filter((e): e is string => typeof e === "string");
  const isLoading = queries.some((query) => query.isLoading);
  const isFetching = queries.some((query) => query.isFetching);

  // If at least one user query is not loading (i.e. has data loaded before), whilst
  // some other (likely new) queries are fetching, then it's a refetch
  const isRefetching = !queries.every((query) => query.isLoading) && isFetching;
  const isError = !!errors.length;

  const usersById = isLoading
    ? undefined
    : new Map(queries.map((q, index) => [ids[index], q.data]));

  return {
    data: usersById,
    errors,
    isError,
    isFetching,
    isLoading,
    isRefetching,
  };
}

export function useUser(id: number | undefined, invalidate: boolean = false) {
  const result = useUsers([id], invalidate);
  return {
    data: result.data?.get(id),
    error: result.errors.join("\n"),
    isError: result.isError,
    isFetching: result.isFetching,
    isLoading: result.isLoading,
  };
}
