import useUsers from "features/userQueries/useUsers";
import { Error as GrpcError } from "grpc-web";
import {
  Community,
  ListAdminsRes,
  ListCommunitiesRes,
  ListDiscussionsRes,
  ListEventsRes,
  ListGroupsRes,
  ListGuidesRes,
  ListMembersRes,
  ListNearbyUsersRes,
  ListPlacesRes,
} from "proto/communities_pb";
import { Discussion } from "proto/discussions_pb";
import { GetThreadRes } from "proto/threads_pb";
import {
  communityAdminsKey,
  CommunityAdminsQueryType,
  communityDiscussionsKey,
  communityEventsKey,
  communityGroupsKey,
  communityGuidesKey,
  communityKey,
  communityMembersKey,
  communityNearbyUsersKey,
  communityPlacesKey,
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

//0 for communityId lists all communities
export const useListSubCommunities = (communityId?: number) =>
  useInfiniteQuery<ListCommunitiesRes.AsObject, GrpcError>(
    subCommunitiesKey(communityId || 0),
    ({ pageParam }) =>
      service.communities.listCommunities(communityId || 0, pageParam),
    {
      enabled: communityId !== undefined,
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

export const useListAdmins = (
  communityId: number,
  type: CommunityAdminsQueryType
) => {
  const query = useInfiniteQuery<ListAdminsRes.AsObject, GrpcError>(
    communityAdminsKey(communityId, type),
    ({ pageParam }) => service.communities.listAdmins(communityId, pageParam),
    {
      enabled: !!communityId,
      getNextPageParam: (lastPage) =>
        lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
    }
  );
  const adminIds = query.data?.pages.flatMap((page) => page.adminUserIdsList);
  const { data: adminUsers, isLoading: isAdminUsersLoading } = useUsers(
    adminIds ?? []
  );

  return {
    ...query,
    adminIds,
    adminUsers,
    isLoading: query.isLoading || isAdminUsersLoading,
  };
};

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

export function useListCommunityEvents(communityId: number) {
  return useInfiniteQuery<ListEventsRes.AsObject, GrpcError>({
    queryKey: communityEventsKey(communityId),
    queryFn: ({ pageParam }) =>
      service.events.listCommunityEvents(communityId, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
  });
}

// Discussions
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
