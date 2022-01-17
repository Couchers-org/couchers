import {
  communityAdminsKey,
  communityDiscussionsKey,
  communityEventsKey,
  communityGroupsKey,
  communityGuidesKey,
  communityKey,
  communityMembersKey,
  communityNearbyUsersKey,
  communityPlacesKey,
  QueryType,
  subCommunitiesKey,
  threadKey,
} from "features/queryKeys";
import useUsers from "features/userQueries/useUsers";
import { RpcError } from "grpc-web";
import { useRouter } from "next/router";
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
import { useEffect } from "react";
import {
  useInfiniteQuery,
  UseInfiniteQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "react-query";
import { routeToCommunity } from "routes";
import { service } from "service";

export const useCommunity = (
  id: number,
  communitySlug?: string,
  options?: Omit<
    UseQueryOptions<Community.AsObject, RpcError>,
    "queryKey" | "queryFn" | "enabled"
  >
) => {
  const queryResult = useQuery<Community.AsObject, RpcError>(
    communityKey(id),
    () =>
      id
        ? service.communities.getCommunity(id)
        : Promise.reject(new Error("Invalid community id")),
    {
      ...options,
      enabled: !!id,
    }
  );

  const router = useRouter();

  useEffect(() => {
    if (!queryResult.isSuccess) {
      return;
    }

    const { slug, communityId } = queryResult.data;

    // guarantee the most recent slug is used if the community was loaded from url params
    // if no slug was provided in the url, then also redirect to page with slug in url
    if (!id && slug !== communitySlug && typeof window !== "undefined") {
      router.push(routeToCommunity(communityId, slug));
    }
  }, [queryResult, router, id, communitySlug]);

  return {
    ...queryResult,
    id,
  };
};

//0 for communityId lists all communities
export const useListSubCommunities = (communityId?: number) =>
  useInfiniteQuery<ListCommunitiesRes.AsObject, RpcError>(
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
  useInfiniteQuery<ListGroupsRes.AsObject, RpcError>(
    communityGroupsKey(communityId!),
    ({ pageParam }) => service.communities.listGroups(communityId!, pageParam),
    {
      enabled: !!communityId,
      getNextPageParam: (lastPage) =>
        lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
    }
  );

export const useListPlaces = (communityId?: number) =>
  useInfiniteQuery<ListPlacesRes.AsObject, RpcError>(
    communityPlacesKey(communityId!),
    ({ pageParam }) => service.communities.listPlaces(communityId!, pageParam),
    {
      enabled: !!communityId,
      getNextPageParam: (lastPage) =>
        lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
    }
  );

export const useListGuides = (communityId?: number) =>
  useInfiniteQuery<ListGuidesRes.AsObject, RpcError>(
    communityGuidesKey(communityId!),
    ({ pageParam }) => service.communities.listGuides(communityId!, pageParam),
    {
      enabled: !!communityId,
      getNextPageParam: (lastPage) =>
        lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
    }
  );

export const useListDiscussions = (communityId: number) =>
  useInfiniteQuery<ListDiscussionsRes.AsObject, RpcError>(
    communityDiscussionsKey(communityId),
    ({ pageParam }) =>
      service.communities.listDiscussions(communityId, pageParam),
    {
      enabled: !!communityId,
      getNextPageParam: (lastPage) =>
        lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
    }
  );

export const useListAdmins = (communityId: number, type: QueryType) => {
  const query = useInfiniteQuery<ListAdminsRes.AsObject, RpcError>(
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
  useInfiniteQuery<ListMembersRes.AsObject, RpcError>(
    communityMembersKey(communityId!),
    ({ pageParam }) => service.communities.listMembers(communityId!, pageParam),
    {
      enabled: !!communityId,
      getNextPageParam: (lastPage) =>
        lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
    }
  );

export const useListNearbyUsers = (communityId?: number) =>
  useInfiniteQuery<ListNearbyUsersRes.AsObject, RpcError>(
    communityNearbyUsersKey(communityId!),
    ({ pageParam }) =>
      service.communities.listNearbyUsers(communityId!, pageParam),
    {
      enabled: !!communityId,
      getNextPageParam: (lastPage) =>
        lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
    }
  );

interface UseListCommunityEventsInput {
  communityId: number;
  pageSize?: number;
  type: QueryType;
}

export function useListCommunityEvents({
  communityId,
  pageSize,
  type,
}: UseListCommunityEventsInput) {
  return useInfiniteQuery<ListEventsRes.AsObject, RpcError>({
    queryKey: communityEventsKey(communityId, type),
    queryFn: ({ pageParam }) =>
      service.events.listCommunityEvents(communityId, pageParam, pageSize),
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
  return useMutation<Discussion.AsObject, RpcError, CreateDiscussionInput>(
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
    UseInfiniteQueryOptions<GetThreadRes.AsObject, RpcError>,
    "queryKey" | "queryFn" | "getNextPageParam"
  >
) =>
  useInfiniteQuery<GetThreadRes.AsObject, RpcError>({
    queryKey: threadKey(threadId),
    queryFn: ({ pageParam }) => service.threads.getThread(threadId, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    ...options,
  });
