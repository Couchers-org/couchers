import { Error as GrpcError } from "grpc-web";
import { User } from "pb/api_pb";
import {
  AvailableWriteReferencesRes,
  ListReferencesRes,
  Reference,
} from "pb/references_pb";
import {
  availableWriteReferencesKey,
  referencesGivenKey,
  referencesReceivedKey,
} from "queryKeys";
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
    queryKey: referencesReceivedKey(user.userId, referenceType),
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
  const { mutate: writeHostRequestReference, status, reset } = useMutation<
    Reference.AsObject,
    Error,
    WriteHostRequestReferenceVariables
  >(
    ({ referenceData }) =>
      service.references.writeHostRequestReference(referenceData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([availableWriteReferencesKey(userId)]);
      },
    }
  );

  return { reset, status, writeHostRequestReference };
}

interface WriteFriendReferenceVariables {
  referenceData: WriteFriendReferenceInput;
}

export function useWriteFriendReference(userId: number) {
  const queryClient = useQueryClient();
  const { mutate: writeFriendReference, status, reset } = useMutation<
    Reference.AsObject,
    Error,
    WriteFriendReferenceVariables
  >(
    ({ referenceData }) =>
      service.references.writeFriendRequestReference(referenceData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([availableWriteReferencesKey(userId)]);
      },
    }
  );

  return { reset, status, writeFriendReference };
}
