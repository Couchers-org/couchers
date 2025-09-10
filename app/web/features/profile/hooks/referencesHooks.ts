import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { RpcError } from "grpc-web";

import type { ReferenceTypeState } from "@/features/profile/view/References";
import type { ListReferencesInfiniteQueryResult } from "@/features/profile/view/ReferencesView";
import {
  REFERENCES_GIVEN_KEY,
  REFERENCES_RECEIVED_BASE_KEY,
  ReferencesReceivedKeyInputs,
  availableWriteReferencesKey,
} from "@/features/queryKeys";
import { User } from "@/proto/api_pb";
import { ListReferencesRes, Reference } from "@/proto/references_pb";
import { service } from "@/service";
import {
  WriteFriendReferenceInput,
  WriteHostRequestReferenceInput,
} from "@/service/references";

export const useReferencesGiven = (
  user: User.AsObject,
): ListReferencesInfiniteQueryResult => {
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
    queryKey: [REFERENCES_GIVEN_KEY, user.userId],
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    initialPageParam: undefined,
  });

  return referencesGivenQuery as unknown as ListReferencesInfiniteQueryResult;
};

export const useReferencesReceived = (
  user: User.AsObject,
  referenceType: Exclude<ReferenceTypeState, "given">,
): ListReferencesInfiniteQueryResult => {
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
      REFERENCES_RECEIVED_BASE_KEY,
      {
        userId: user.userId,
        type: referenceType,
      } as ReferencesReceivedKeyInputs,
    ],
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    initialPageParam: undefined,
  });

  return referencesReceivedQuery as unknown as ListReferencesInfiniteQueryResult;
};

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

export const useWriteHostReference = (userId: number) => {
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

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [availableWriteReferencesKey(userId)],
      });
      await queryClient.invalidateQueries({
        predicate: ({ queryKey }) =>
          queryKey[0] === REFERENCES_RECEIVED_BASE_KEY &&
          (queryKey[1] as ReferencesReceivedKeyInputs).userId === userId,
      });
    },
  });

  return { reset, status, writeHostRequestReference, error, isPending };
};

interface WriteFriendReferenceVariables {
  referenceData: WriteFriendReferenceInput;
}

export const useWriteFriendReference = (userId: number) => {
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [availableWriteReferencesKey(userId)],
      });
      await queryClient.invalidateQueries({
        predicate: ({ queryKey }) =>
          queryKey[0] === REFERENCES_RECEIVED_BASE_KEY &&
          (queryKey[1] as ReferencesReceivedKeyInputs).userId === userId,
      });
    },
  });

  return { reset, status, writeFriendReference, error, isPending };
};
