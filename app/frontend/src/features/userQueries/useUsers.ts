import { Error } from "grpc-web";
import { useCallback, useEffect, useRef } from "react";
import { useQueries, useQueryClient } from "react-query";

import { User } from "../../pb/api_pb";
import { service } from "../../service";
import { arrayEq } from "../../utils/arrayEq";
import { userStaleTime } from "./constants";

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
          query.queryKey[0] === "user" &&
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
        queryKey: ["user", id],
        queryFn: () => service.user.getUser(id.toString()),
        staleTime: userStaleTime,
      }))
  );

  const errors = queries
    .map((query) => query.error?.message)
    .filter((e): e is string => typeof e === "string");
  const isLoading = queries.some((query) => query.isLoading);
  const isFetching = queries.some((query) => query.isFetching);
  const isError = !!errors.length;

  const usersById = isLoading
    ? undefined
    : new Map(queries.map((q, index) => [ids[index], q.data]));

  return {
    isLoading,
    isFetching,
    isError,
    errors,
    data: usersById,
  };
}

export function useUser(id: number | undefined, invalidate: boolean = false) {
  const result = useUsers([id], invalidate);
  return {
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    isError: result.isError,
    error: result.errors.join("\n"),
    data: result.data?.get(id),
  };
}
