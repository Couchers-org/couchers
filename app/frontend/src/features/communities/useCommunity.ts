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
import {
  communityAdminsKey,
  communityDiscussionsKey,
  communityGroupsKey,
  communityGuidesKey,
  communityKey,
  communityMembersKey,
  communityNearbyUsersKey,
  communityPlacesKey,
  subCommunitiesKey,
} from "queryKeys";
import {
  QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
} from "react-query";
import { service } from "service/index";

export const useCommunity = (id: number) =>
  useQuery<Community.AsObject, GrpcError>(communityKey(id), () =>
    service.communities.getCommunity(id)
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

export const useListDiscussions = (communityId?: number) =>
  useInfiniteQuery<ListDiscussionsRes.AsObject, GrpcError>(
    communityDiscussionsKey(communityId!),
    ({ pageParam }) =>
      service.communities.listDiscussions(communityId!, pageParam),
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

export const useNewDiscussionMutation = (queryClient: QueryClient) =>
  useMutation<
    Discussion.AsObject,
    GrpcError,
    {
      title: string;
      content: string;
      ownerCommunityId: number;
    }
  >(
    ({ title, content, ownerCommunityId }) =>
      service.discussions.createDiscussion(title, content, ownerCommunityId),
    {
      onSuccess(_, { ownerCommunityId }) {
        queryClient.invalidateQueries(
          communityDiscussionsKey(ownerCommunityId)
        );
      },
    }
  );
