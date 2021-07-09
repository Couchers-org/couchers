import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as grpcWeb from "grpc-web";

import * as pb_communities_pb from "../pb/communities_pb";

export class CommunitiesClient {
  constructor(
    hostname: string,
    credentials?: null | { [index: string]: string },
    options?: null | { [index: string]: any }
  );

  getCommunity(
    request: pb_communities_pb.GetCommunityReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: pb_communities_pb.Community
    ) => void
  ): grpcWeb.ClientReadableStream<pb_communities_pb.Community>;

  listCommunities(
    request: pb_communities_pb.ListCommunitiesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: pb_communities_pb.ListCommunitiesRes
    ) => void
  ): grpcWeb.ClientReadableStream<pb_communities_pb.ListCommunitiesRes>;

  listGroups(
    request: pb_communities_pb.ListGroupsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: pb_communities_pb.ListGroupsRes
    ) => void
  ): grpcWeb.ClientReadableStream<pb_communities_pb.ListGroupsRes>;

  listAdmins(
    request: pb_communities_pb.ListAdminsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: pb_communities_pb.ListAdminsRes
    ) => void
  ): grpcWeb.ClientReadableStream<pb_communities_pb.ListAdminsRes>;

  listMembers(
    request: pb_communities_pb.ListMembersReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: pb_communities_pb.ListMembersRes
    ) => void
  ): grpcWeb.ClientReadableStream<pb_communities_pb.ListMembersRes>;

  listNearbyUsers(
    request: pb_communities_pb.ListNearbyUsersReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: pb_communities_pb.ListNearbyUsersRes
    ) => void
  ): grpcWeb.ClientReadableStream<pb_communities_pb.ListNearbyUsersRes>;

  listPlaces(
    request: pb_communities_pb.ListPlacesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: pb_communities_pb.ListPlacesRes
    ) => void
  ): grpcWeb.ClientReadableStream<pb_communities_pb.ListPlacesRes>;

  listGuides(
    request: pb_communities_pb.ListGuidesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: pb_communities_pb.ListGuidesRes
    ) => void
  ): grpcWeb.ClientReadableStream<pb_communities_pb.ListGuidesRes>;

  listEvents(
    request: pb_communities_pb.ListEventsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: pb_communities_pb.ListEventsRes
    ) => void
  ): grpcWeb.ClientReadableStream<pb_communities_pb.ListEventsRes>;

  listDiscussions(
    request: pb_communities_pb.ListDiscussionsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: pb_communities_pb.ListDiscussionsRes
    ) => void
  ): grpcWeb.ClientReadableStream<pb_communities_pb.ListDiscussionsRes>;

  joinCommunity(
    request: pb_communities_pb.JoinCommunityReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: google_protobuf_empty_pb.Empty
    ) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  leaveCommunity(
    request: pb_communities_pb.LeaveCommunityReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: google_protobuf_empty_pb.Empty
    ) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  listUserCommunities(
    request: pb_communities_pb.ListUserCommunitiesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: pb_communities_pb.ListUserCommunitiesRes
    ) => void
  ): grpcWeb.ClientReadableStream<pb_communities_pb.ListUserCommunitiesRes>;
}

export class CommunitiesPromiseClient {
  constructor(
    hostname: string,
    credentials?: null | { [index: string]: string },
    options?: null | { [index: string]: any }
  );

  getCommunity(
    request: pb_communities_pb.GetCommunityReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_communities_pb.Community>;

  listCommunities(
    request: pb_communities_pb.ListCommunitiesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_communities_pb.ListCommunitiesRes>;

  listGroups(
    request: pb_communities_pb.ListGroupsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_communities_pb.ListGroupsRes>;

  listAdmins(
    request: pb_communities_pb.ListAdminsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_communities_pb.ListAdminsRes>;

  listMembers(
    request: pb_communities_pb.ListMembersReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_communities_pb.ListMembersRes>;

  listNearbyUsers(
    request: pb_communities_pb.ListNearbyUsersReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_communities_pb.ListNearbyUsersRes>;

  listPlaces(
    request: pb_communities_pb.ListPlacesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_communities_pb.ListPlacesRes>;

  listGuides(
    request: pb_communities_pb.ListGuidesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_communities_pb.ListGuidesRes>;

  listEvents(
    request: pb_communities_pb.ListEventsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_communities_pb.ListEventsRes>;

  listDiscussions(
    request: pb_communities_pb.ListDiscussionsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_communities_pb.ListDiscussionsRes>;

  joinCommunity(
    request: pb_communities_pb.JoinCommunityReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  leaveCommunity(
    request: pb_communities_pb.LeaveCommunityReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  listUserCommunities(
    request: pb_communities_pb.ListUserCommunitiesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_communities_pb.ListUserCommunitiesRes>;
}
