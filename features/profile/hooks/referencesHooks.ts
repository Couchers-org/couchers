import {
  availableWriteReferencesKey,
  referencesGivenKey,
  referencesReceivedBaseKey,
  referencesReceivedKey,
  ReferencesReceivedKeyInputs,
} from "features/queryKeys";
import { Error as GrpcError } from "grpc-web";
import { User } from "proto/api_pb";
import {
  AvailableWriteReferencesRes,
  ListReferencesRes,
  Reference,
} from "proto/references_pb";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "react-query";
import { service } from "service";
import {
  WriteFriendReferenceInput,
  WriteHostRequestReferenceInput,
} from "service/references";

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
    queryKey: referencesReceivedKey({
      userId: user.userId,
      type: referenceType,
    }),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
  });

  return referencesReceivedQuery;
}

export const useListAvailableReferences = (userId: number) =>
  useQuery<AvailableWriteReferencesRes.AsObject, GrpcError>(
    availableWriteReferencesKey(userId),
    () =>
      service.references.getAvailableReferences({
        userId,
      })
  );

interface WriteHostRequestReferenceVariables {
  referenceData: WriteHostRequestReferenceInput;
}

export function useWriteHostReference(userId: number) {
  const queryClient = useQueryClient();
  const {
    mutate: writeHostRequestReference,
    status,
    reset,
    error,
    isLoading,
  } = useMutation<
    Reference.AsObject,
    Error,
    WriteHostRequestReferenceVariables
  >(
    ({ referenceData }) =>
      service.references.writeHostRequestReference(referenceData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([availableWriteReferencesKey(userId)]);
        queryClient.invalidateQueries({
          predicate: ({ queryKey }) =>
            queryKey[0] === referencesReceivedBaseKey &&
            (queryKey[1] as ReferencesReceivedKeyInputs)?.userId === userId,
        });
      },
    }
  );

  return { reset, status, writeHostRequestReference, error, isLoading };
}

interface WriteFriendReferenceVariables {
  referenceData: WriteFriendReferenceInput;
}

export function useWriteFriendReference(userId: number) {
  const queryClient = useQueryClient();
  const {
    mutate: writeFriendReference,
    status,
    reset,
    error,
    isLoading,
  } = useMutation<Reference.AsObject, Error, WriteFriendReferenceVariables>(
    ({ referenceData }) =>
      service.references.writeFriendRequestReference(referenceData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([availableWriteReferencesKey(userId)]);
        queryClient.invalidateQueries({
          predicate: ({ queryKey }) =>
            queryKey[0] === referencesReceivedBaseKey &&
            (queryKey[1] as ReferencesReceivedKeyInputs)?.userId === userId,
        });
      },
    }
  );

  return { reset, status, writeFriendReference, error, isLoading };
}
