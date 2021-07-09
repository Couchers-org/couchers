import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as grpcWeb from "grpc-web";

import * as pb_groups_pb from "../pb/groups_pb";

export class GroupsClient {
  constructor(
    hostname: string,
    credentials?: null | { [index: string]: string },
    options?: null | { [index: string]: any }
  );

  getGroup(
    request: pb_groups_pb.GetGroupReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error, response: pb_groups_pb.Group) => void
  ): grpcWeb.ClientReadableStream<pb_groups_pb.Group>;

  listAdmins(
    request: pb_groups_pb.ListAdminsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error, response: pb_groups_pb.ListAdminsRes) => void
  ): grpcWeb.ClientReadableStream<pb_groups_pb.ListAdminsRes>;

  listMembers(
    request: pb_groups_pb.ListMembersReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: pb_groups_pb.ListMembersRes
    ) => void
  ): grpcWeb.ClientReadableStream<pb_groups_pb.ListMembersRes>;

  listPlaces(
    request: pb_groups_pb.ListPlacesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error, response: pb_groups_pb.ListPlacesRes) => void
  ): grpcWeb.ClientReadableStream<pb_groups_pb.ListPlacesRes>;

  listGuides(
    request: pb_groups_pb.ListGuidesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error, response: pb_groups_pb.ListGuidesRes) => void
  ): grpcWeb.ClientReadableStream<pb_groups_pb.ListGuidesRes>;

  listEvents(
    request: pb_groups_pb.ListEventsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error, response: pb_groups_pb.ListEventsRes) => void
  ): grpcWeb.ClientReadableStream<pb_groups_pb.ListEventsRes>;

  listDiscussions(
    request: pb_groups_pb.ListDiscussionsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: pb_groups_pb.ListDiscussionsRes
    ) => void
  ): grpcWeb.ClientReadableStream<pb_groups_pb.ListDiscussionsRes>;

  joinGroup(
    request: pb_groups_pb.JoinGroupReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: google_protobuf_empty_pb.Empty
    ) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  leaveGroup(
    request: pb_groups_pb.LeaveGroupReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: google_protobuf_empty_pb.Empty
    ) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  listUserGroups(
    request: pb_groups_pb.ListUserGroupsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: pb_groups_pb.ListUserGroupsRes
    ) => void
  ): grpcWeb.ClientReadableStream<pb_groups_pb.ListUserGroupsRes>;
}

export class GroupsPromiseClient {
  constructor(
    hostname: string,
    credentials?: null | { [index: string]: string },
    options?: null | { [index: string]: any }
  );

  getGroup(
    request: pb_groups_pb.GetGroupReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_groups_pb.Group>;

  listAdmins(
    request: pb_groups_pb.ListAdminsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_groups_pb.ListAdminsRes>;

  listMembers(
    request: pb_groups_pb.ListMembersReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_groups_pb.ListMembersRes>;

  listPlaces(
    request: pb_groups_pb.ListPlacesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_groups_pb.ListPlacesRes>;

  listGuides(
    request: pb_groups_pb.ListGuidesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_groups_pb.ListGuidesRes>;

  listEvents(
    request: pb_groups_pb.ListEventsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_groups_pb.ListEventsRes>;

  listDiscussions(
    request: pb_groups_pb.ListDiscussionsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_groups_pb.ListDiscussionsRes>;

  joinGroup(
    request: pb_groups_pb.JoinGroupReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  leaveGroup(
    request: pb_groups_pb.LeaveGroupReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  listUserGroups(
    request: pb_groups_pb.ListUserGroupsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_groups_pb.ListUserGroupsRes>;
}
