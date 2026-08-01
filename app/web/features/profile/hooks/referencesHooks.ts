import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { User } from "couchers/proto/api_pb";
import { ListReferencesRes, Reference } from "couchers/proto/references_pb";
import {
  availableWriteReferencesKey,
  referencesGivenKey,
  referencesReceivedBaseKey,
  ReferencesReceivedKeyInputs,
} from "features/queryKeys";
import { RpcError } from "grpc-web";
import { service } from "service";
import {
  WriteFriendReferenceInput,
  WriteHostRequestReferenceInput,
} from "service/references";

import type { ReferenceTypeState } from "../view/References";
import type { ListReferencesInfiniteQueryResult } from "../view/ReferencesView";

export function useReferencesGiven(
  user: User.AsObject,
): ListReferencesInfiniteQueryResult {
  const referencesGivenQuery = useInfiniteQuery<
    ListReferencesRes.AsObject,
    RpcError,
    InfiniteData<ListReferencesRes.AsObject>
  >({
    queryFn: ({ pageParam }: { pageParam?: unknown }) =>
      service.references.getReferencesGivenByUser({
        pageToken: pageParam as string,
        userId: user.userId,
      }),
    queryKey: [referencesGivenKey, user.userId],
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    initialPageParam: undefined,
  });

  return referencesGivenQuery as unknown as ListReferencesInfiniteQueryResult;
}

export function useReferencesReceived(
  user: User.AsObject,
  referenceType: Exclude<ReferenceTypeState, "given">,
): ListReferencesInfiniteQueryResult {
  const referencesReceivedQuery = useInfiniteQuery<
    ListReferencesRes.AsObject,
    RpcError,
    InfiniteData<ListReferencesRes.AsObject>
  >({
    queryFn: ({ pageParam }: { pageParam?: unknown }) =>
      service.references.getReferencesReceivedForUser({
        pageToken: pageParam as string,
        referenceType,
        userId: user.userId,
      }),
    queryKey: [
      referencesReceivedBaseKey,
      {
        userId: user.userId,
        type: referenceType,
      } as ReferencesReceivedKeyInputs,
    ],
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    initialPageParam: undefined,
  });

  return referencesReceivedQuery as unknown as ListReferencesInfiniteQueryResult;
}

export const useListAvailableReferences = (userId: number) =>
  useQuery({
    queryKey: availableWriteReferencesKey(userId),

    queryFn: () =>
      service.references.getAvailableReferences({
        userId,
      }),
  });

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
    isPending,
  } = useMutation<
    Reference.AsObject,
    Error,
    WriteHostRequestReferenceVariables
  >({
    mutationFn: ({ referenceData }) =>
      service.references.writeHostRequestReference(referenceData),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [availableWriteReferencesKey(userId)],
      });
      queryClient.invalidateQueries({
        predicate: ({ queryKey }) =>
          queryKey[0] === referencesReceivedBaseKey &&
          (queryKey[1] as ReferencesReceivedKeyInputs)?.userId === userId,
      });
    },
  });

  return { reset, status, writeHostRequestReference, error, isPending };
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
    isPending,
  } = useMutation<Reference.AsObject, Error, WriteFriendReferenceVariables>({
    mutationFn: ({ referenceData }) =>
      service.references.writeFriendRequestReference(referenceData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [availableWriteReferencesKey(userId)],
      });
      queryClient.invalidateQueries({
        predicate: ({ queryKey }) =>
          queryKey[0] === referencesReceivedBaseKey &&
          (queryKey[1] as ReferencesReceivedKeyInputs)?.userId === userId,
      });
    },
  });

  return { reset, status, writeFriendReference, error, isPending };
}
