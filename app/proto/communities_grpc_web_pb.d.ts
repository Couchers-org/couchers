import * as grpcWeb from 'grpc-web';

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as communities_pb from './communities_pb'; // proto import: "communities.proto"


export class CommunitiesClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  getCommunity(
    request: communities_pb.GetCommunityReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: communities_pb.Community) => void
  ): grpcWeb.ClientReadableStream<communities_pb.Community>;

  listCommunities(
    request: communities_pb.ListCommunitiesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: communities_pb.ListCommunitiesRes) => void
  ): grpcWeb.ClientReadableStream<communities_pb.ListCommunitiesRes>;

  listGroups(
    request: communities_pb.ListGroupsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: communities_pb.ListGroupsRes) => void
  ): grpcWeb.ClientReadableStream<communities_pb.ListGroupsRes>;

  listAdmins(
    request: communities_pb.ListAdminsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: communities_pb.ListAdminsRes) => void
  ): grpcWeb.ClientReadableStream<communities_pb.ListAdminsRes>;

  addAdmin(
    request: communities_pb.AddAdminReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  removeAdmin(
    request: communities_pb.RemoveAdminReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  listMembers(
    request: communities_pb.ListMembersReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: communities_pb.ListMembersRes) => void
  ): grpcWeb.ClientReadableStream<communities_pb.ListMembersRes>;

  listNearbyUsers(
    request: communities_pb.ListNearbyUsersReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: communities_pb.ListNearbyUsersRes) => void
  ): grpcWeb.ClientReadableStream<communities_pb.ListNearbyUsersRes>;

  listPlaces(
    request: communities_pb.ListPlacesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: communities_pb.ListPlacesRes) => void
  ): grpcWeb.ClientReadableStream<communities_pb.ListPlacesRes>;

  listGuides(
    request: communities_pb.ListGuidesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: communities_pb.ListGuidesRes) => void
  ): grpcWeb.ClientReadableStream<communities_pb.ListGuidesRes>;

  listEvents(
    request: communities_pb.ListEventsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: communities_pb.ListEventsRes) => void
  ): grpcWeb.ClientReadableStream<communities_pb.ListEventsRes>;

  listDiscussions(
    request: communities_pb.ListDiscussionsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: communities_pb.ListDiscussionsRes) => void
  ): grpcWeb.ClientReadableStream<communities_pb.ListDiscussionsRes>;

  joinCommunity(
    request: communities_pb.JoinCommunityReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  leaveCommunity(
    request: communities_pb.LeaveCommunityReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  listUserCommunities(
    request: communities_pb.ListUserCommunitiesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: communities_pb.ListUserCommunitiesRes) => void
  ): grpcWeb.ClientReadableStream<communities_pb.ListUserCommunitiesRes>;

}

export class CommunitiesPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  getCommunity(
    request: communities_pb.GetCommunityReq,
    metadata?: grpcWeb.Metadata
  ): Promise<communities_pb.Community>;

  listCommunities(
    request: communities_pb.ListCommunitiesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<communities_pb.ListCommunitiesRes>;

  listGroups(
    request: communities_pb.ListGroupsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<communities_pb.ListGroupsRes>;

  listAdmins(
    request: communities_pb.ListAdminsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<communities_pb.ListAdminsRes>;

  addAdmin(
    request: communities_pb.AddAdminReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  removeAdmin(
    request: communities_pb.RemoveAdminReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  listMembers(
    request: communities_pb.ListMembersReq,
    metadata?: grpcWeb.Metadata
  ): Promise<communities_pb.ListMembersRes>;

  listNearbyUsers(
    request: communities_pb.ListNearbyUsersReq,
    metadata?: grpcWeb.Metadata
  ): Promise<communities_pb.ListNearbyUsersRes>;

  listPlaces(
    request: communities_pb.ListPlacesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<communities_pb.ListPlacesRes>;

  listGuides(
    request: communities_pb.ListGuidesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<communities_pb.ListGuidesRes>;

  listEvents(
    request: communities_pb.ListEventsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<communities_pb.ListEventsRes>;

  listDiscussions(
    request: communities_pb.ListDiscussionsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<communities_pb.ListDiscussionsRes>;

  joinCommunity(
    request: communities_pb.JoinCommunityReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  leaveCommunity(
    request: communities_pb.LeaveCommunityReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  listUserCommunities(
    request: communities_pb.ListUserCommunitiesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<communities_pb.ListUserCommunitiesRes>;

}

