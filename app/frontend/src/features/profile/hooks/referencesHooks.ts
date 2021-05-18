import { Error as GrpcError } from "grpc-web";
import { User } from "pb/api_pb";
import { ListReferencesRes } from "pb/references_pb";
import { referencesGivenKey, referencesReceivedKey } from "queryKeys";
import { useInfiniteQuery } from "react-query";
import { service } from "service";

import type { ReferenceTypeState } from "../view/References";

export function useReferencesGiven(user: User.AsObject) {
  const referencesGivenQuery = useInfiniteQuery<
    ListReferencesRes.AsObject,
    GrpcError
  >({
    queryFn: ({ pageParam: pageToken }: { pageParam?: string }) =>
      service.references.getReferencesGivenByUser({
        pageToken,
        userId: user.userId,
      }),
    queryKey: referencesGivenKey(user.userId),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
  });

  return referencesGivenQuery;
}

export function useReferencesReceived(
  user: User.AsObject,
  referenceType: Exclude<ReferenceTypeState, "given">
) {
  const referencesReceivedQuery = useInfiniteQuery<
    ListReferencesRes.AsObject,
    GrpcError
  >({
    queryFn: ({ pageParam: pageToken }: { pageParam?: string }) =>
      service.references.getReferencesReceivedForUser({
        pageToken,
        referenceType,
        userId: user.userId,
      }),
    queryKey: referencesReceivedKey(user.userId, referenceType),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
  });

  return referencesReceivedQuery;
}
