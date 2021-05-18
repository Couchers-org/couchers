import { Error as GrpcError } from "grpc-web";
import {
  Community,
  ListAdminsRes,
  ListCommunitiesRes,
  ListDiscussionsRes,
  ListGroupsRes,
  ListGuidesRes,
  ListMembersRes,
  ListNearbyUsersRes,
  ListPlacesRes,
} from "pb/communities_pb";
import { Discussion } from "pb/discussions_pb";
import { AvailableWriteReferencesRes, Reference } from "pb/references_pb";
import { GetThreadRes } from "pb/threads_pb";

import {
  communityAdminsKey,
  communityDiscussionsKey,
  communityGroupsKey,
  communityGuidesKey,
  communityKey,
  communityMembersKey,
  communityNearbyUsersKey,
  communityPlacesKey,
  referencesKey,
  subCommunitiesKey,
  threadKey,
} from "queryKeys";
import {
  useInfiniteQuery,
  UseInfiniteQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "react-query";
import { service } from "service";
import {
  WriteFriendReferenceInput,
  WriteHostRequestReferenceInput,
} from "service/references";
import { SetMutationError } from "utils/types";

export const useCommunity = (
  id: number,
  options?: Omit<
    UseQueryOptions<Community.AsObject, GrpcError>,
    "queryKey" | "queryFn"
  >
) =>
  useQuery<Community.AsObject, GrpcError>(
    communityKey(id),
    () => service.communities.getCommunity(id),
    options
  );

export const useListSubCommunities = (communityId?: number) =>
  useInfiniteQuery<ListCommunitiesRes.AsObject, GrpcError>(
    subCommunitiesKey(communityId!),
    ({ pageParam }) =>
      service.communities.listCommunities(communityId!, pageParam),
    {
      enabled: !!communityId,
      getNextPageParam: (lastPage) =>
        lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
    }
  );

export const useListGroups = (communityId?: number) =>
  useInfiniteQuery<ListGroupsRes.AsObject, GrpcError>(
    communityGroupsKey(communityId!),
    ({ pageParam }) => service.communities.listGroups(communityId!, pageParam),
    {
      enabled: !!communityId,
      getNextPageParam: (lastPage) =>
        lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
    }
  );

export const useListPlaces = (communityId?: number) =>
  useInfiniteQuery<ListPlacesRes.AsObject, GrpcError>(
    communityPlacesKey(communityId!),
    ({ pageParam }) => service.communities.listPlaces(communityId!, pageParam),
    {
      enabled: !!communityId,
      getNextPageParam: (lastPage) =>
        lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
    }
  );

export const useListGuides = (communityId?: number) =>
  useInfiniteQuery<ListGuidesRes.AsObject, GrpcError>(
    communityGuidesKey(communityId!),
    ({ pageParam }) => service.communities.listGuides(communityId!, pageParam),
    {
      enabled: !!communityId,
      getNextPageParam: (lastPage) =>
        lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
    }
  );

export const useListDiscussions = (communityId: number) =>
  useInfiniteQuery<ListDiscussionsRes.AsObject, GrpcError>(
    communityDiscussionsKey(communityId),
    ({ pageParam }) =>
      service.communities.listDiscussions(communityId, pageParam),
    {
      enabled: !!communityId,
      getNextPageParam: (lastPage) =>
        lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
    }
  );

export const useListAdmins = (communityId?: number) =>
  useInfiniteQuery<ListAdminsRes.AsObject, GrpcError>(
    communityAdminsKey(communityId!),
    ({ pageParam }) => service.communities.listAdmins(communityId!, pageParam),
    {
      enabled: !!communityId,
      getNextPageParam: (lastPage) =>
        lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
    }
  );

export const useListMembers = (communityId?: number) =>
  useInfiniteQuery<ListMembersRes.AsObject, GrpcError>(
    communityMembersKey(communityId!),
    ({ pageParam }) => service.communities.listMembers(communityId!, pageParam),
    {
      enabled: !!communityId,
      getNextPageParam: (lastPage) =>
        lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
    }
  );

export const useListNearbyUsers = (communityId?: number) =>
  useInfiniteQuery<ListNearbyUsersRes.AsObject, GrpcError>(
    communityNearbyUsersKey(communityId!),
    ({ pageParam }) =>
      service.communities.listNearbyUsers(communityId!, pageParam),
    {
      enabled: !!communityId,
      getNextPageParam: (lastPage) =>
        lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
    }
  );

export interface CreateDiscussionInput {
  title: string;
  content: string;
  ownerCommunityId: number;
}

export const useNewDiscussionMutation = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation<Discussion.AsObject, GrpcError, CreateDiscussionInput>(
    ({ title, content, ownerCommunityId }) =>
      service.discussions.createDiscussion(title, content, ownerCommunityId),
    {
      onSuccess(_, { ownerCommunityId }) {
        onSuccess?.();
        queryClient.invalidateQueries(
          communityDiscussionsKey(ownerCommunityId)
        );
      },
    }
  );

  export const useListAvailableReferences = (
    userId: number,
    type: "received" | "given" | "all"
  ) =>
    useQuery<AvailableWriteReferencesRes.AsObject, GrpcError>(
      referencesKey(userId, type),
      () =>
        service.references.getAvailableReferences({
          userId,
        })
    );

  interface WriteHostRequestReferenceVariables {
    referenceData: WriteHostRequestReferenceInput;
    setMutationError: SetMutationError;
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
        onError: (error, { setMutationError }) => {
          setMutationError(error.message);
        },
        onMutate: async ({ setMutationError }) => {
          setMutationError(null);
        },
        onSuccess: () => {
          queryClient.invalidateQueries([referencesKey(userId, "all")]);
        },
      }
    );

    return { reset, status, writeHostRequestReference };
  }

  interface WriteFriendReferenceVariables {
    referenceData: WriteFriendReferenceInput;
    setMutationError: SetMutationError;
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
        onError: (error, { setMutationError }) => {
          setMutationError(error.message);
        },
        onMutate: async ({ setMutationError }) => {
          setMutationError(null);
        },
        onSuccess: () => {
          queryClient.invalidateQueries([referencesKey(userId, "all")]);
        },
      }
    );

    return { reset, status, writeFriendReference };
  }
};

export const useThread = (
  threadId: number,
  options?: Omit<
    UseInfiniteQueryOptions<GetThreadRes.AsObject, GrpcError>,
    "queryKey" | "queryFn" | "getNextPageParam"
  >
) =>
  useInfiniteQuery<GetThreadRes.AsObject, GrpcError>({
    queryKey: threadKey(threadId),
    queryFn: ({ pageParam }) => service.threads.getThread(threadId, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    ...options,
  });
