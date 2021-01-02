import { Error } from "grpc-web";
import { useEffect } from "react";
import { useQueries, useQueryClient } from "react-query";
import { User } from "../../pb/api_pb";
import { service } from "../../service";
import { userStaleTime } from "./constants";

export default function useUsers(ids: number[], invalidate: boolean = false) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (invalidate) {
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "user" &&
          ids.includes(query.queryKey[1] as number),
      });
    }
    //for some reason, using just 'ids' was causing the effect to always run
    //even though ids is never mutated
  }, [invalidate, queryClient, JSON.stringify(ids)]); //eslint-disable-line react-hooks/exhaustive-deps

  const queries = useQueries<User.AsObject, Error>(
    ids.map((id) => ({
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

export function useUser(id: number, invalidate: boolean = false) {
  const result = useUsers([id], invalidate);
  return {
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.errors.join("\n"),
    data: result.data?.get(id),
  };
}
