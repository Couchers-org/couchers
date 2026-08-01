import {
  InfiniteData,
  keepPreviousData,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  Community,
  ListAdminsRes,
  ListCommunitiesRes,
  ListDiscussionsRes,
  ListEventsRes,
  ListMembersRes,
  ListNearbyUsersRes,
  ListUserCommunitiesRes,
} from "couchers/proto/communities_pb";
import { Discussion } from "couchers/proto/discussions_pb";
import { GetVolunteersRes } from "couchers/proto/public_pb";
import { GetThreadRes } from "couchers/proto/threads_pb";
import {
  communityAdminsKey,
  communityDiscussionsKey,
  communityEventsKey,
  communityKey,
  communityMembersKey,
  communityNearbyUsersKey,
  QueryType,
  subCommunitiesKey,
  threadKey,
  userCommunitiesListKey,
  volunteersKey,
} from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { routeToCommunity } from "routes";
import { service } from "service";

export const useCommunity = (
  id: number,
  communitySlug?: string,
  options?: Omit<
    UseQueryOptions<Community.AsObject, RpcError>,
    "queryKey" | "queryFn" | "enabled"
  >,
) => {
  const queryResult = useQuery({
    queryKey: communityKey(id),
    queryFn: () =>
      id
        ? service.communities.getCommunity(id)
        : Promise.reject(new Error("Invalid community id")),
    ...options,
    enabled: !!id,
  });

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
export const useListSubCommunities = (communityId: number) =>
  useInfiniteQuery<ListCommunitiesRes.AsObject, RpcError>({
    queryKey: subCommunitiesKey(communityId),
    queryFn: ({ pageParam }) =>
      service.communities.listCommunities(
        communityId,
        pageParam as string | undefined,
      ),
    initialPageParam: undefined,
    enabled: communityId !== undefined,
    getNextPageParam: (lastPage) =>
      lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
  });

export const useListDiscussions = (communityId: number) =>
  useInfiniteQuery<ListDiscussionsRes.AsObject, RpcError>({
    queryKey: communityDiscussionsKey(communityId),
    queryFn: ({ pageParam }) =>
      service.communities.listDiscussions(
        communityId,
        pageParam as string | undefined,
      ),
    initialPageParam: undefined,
    enabled: !!communityId,
    getNextPageParam: (lastPage) =>
      lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
  });

export const useListAdmins = (communityId: number, type: QueryType) => {
  const query = useInfiniteQuery<ListAdminsRes.AsObject, RpcError>({
    queryKey: communityAdminsKey(communityId, type),
    queryFn: ({ pageParam }) =>
      service.communities.listAdmins(
        communityId,
        pageParam as string | undefined,
      ),
    initialPageParam: undefined,
    enabled: !!communityId,
    getNextPageParam: (lastPage) =>
      lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
  });
  const adminIds = query.data?.pages.flatMap((page) => page.adminUserIdsList);
  return { ...query, adminIds };
};

export const useListMembers = ({
  communityId,
  pageSize,
}: {
  communityId: number;
  pageSize: number;
}) =>
  useInfiniteQuery<ListMembersRes.AsObject, RpcError>({
    queryKey: [...communityMembersKey(communityId!), pageSize],
    queryFn: ({ pageParam }) =>
      service.communities.listMembers({
        communityId: communityId,
        pageSize,
        pageToken: pageParam as string | undefined,
      }),
    initialPageParam: undefined,
    placeholderData: keepPreviousData,
    enabled: !!communityId,
    getNextPageParam: (lastPage) =>
      lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
  });

export const useListNearbyUsers = (communityId: number) =>
  useInfiniteQuery<ListNearbyUsersRes.AsObject, RpcError>({
    queryKey: communityNearbyUsersKey(communityId),
    queryFn: ({ pageParam }) =>
      service.communities.listNearbyUsers(
        communityId,
        pageParam as string | undefined,
      ),
    initialPageParam: undefined,
    enabled: !!communityId,
    getNextPageParam: (lastPage) =>
      lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
  });

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
      service.events.listCommunityEvents(
        communityId,
        pageParam as string | undefined,
        pageSize,
      ),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    initialPageParam: undefined,
  });
}

// Discussions
export interface CreateDiscussionInput {
  title: string;
  content: string;
  ownerCommunityId: number;
}

export const useListUserCommunities = () =>
  useInfiniteQuery<ListUserCommunitiesRes.AsObject, RpcError>({
    queryKey: [userCommunitiesListKey],
    queryFn: ({ pageParam }) =>
      service.communities.listUserCommunities(pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
    staleTime: 10 * 60 * 1000,
  });

export const useNewDiscussionMutation = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation<Discussion.AsObject, RpcError, CreateDiscussionInput>({
    mutationFn: ({ title, content, ownerCommunityId }) =>
      service.discussions.createDiscussion(title, content, ownerCommunityId),
    onSuccess(_, { ownerCommunityId }) {
      onSuccess?.();
      queryClient.invalidateQueries({
        queryKey: communityDiscussionsKey(ownerCommunityId),
      });
    },
  });
};

export const useThread = (
  threadId: number,
  options?: Omit<
    UseInfiniteQueryOptions<
      GetThreadRes.AsObject,
      RpcError,
      InfiniteData<GetThreadRes.AsObject>,
      ReturnType<typeof threadKey>
    >,
    "queryKey" | "queryFn" | "getNextPageParam" | "initialPageParam" | "enabled"
  > & { enabled?: boolean; initialPageParam?: string },
) =>
  useInfiniteQuery<
    GetThreadRes.AsObject,
    RpcError,
    InfiniteData<GetThreadRes.AsObject>,
    ReturnType<typeof threadKey>
  >({
    queryKey: threadKey(threadId),
    queryFn: ({ pageParam }) =>
      service.threads.getThread(threadId, pageParam as string | undefined),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    initialPageParam: undefined,
    ...options,
  });

export const useListVolunteers = (
  options?: Omit<
    UseQueryOptions<GetVolunteersRes.AsObject, RpcError>,
    "queryKey" | "queryFn" | "getNextPageParam"
  >,
) =>
  useQuery<GetVolunteersRes.AsObject, RpcError>({
    queryKey: [volunteersKey],
    queryFn: () => service.publicApi.getVolunteers(),
    ...options,
  });
