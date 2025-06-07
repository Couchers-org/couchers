import * as grpcWeb from 'grpc-web';

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as groups_pb from './groups_pb'; // proto import: "groups.proto"


export class GroupsClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  getGroup(
    request: groups_pb.GetGroupReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: groups_pb.Group) => void
  ): grpcWeb.ClientReadableStream<groups_pb.Group>;

  listAdmins(
    request: groups_pb.ListAdminsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: groups_pb.ListAdminsRes) => void
  ): grpcWeb.ClientReadableStream<groups_pb.ListAdminsRes>;

  listMembers(
    request: groups_pb.ListMembersReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: groups_pb.ListMembersRes) => void
  ): grpcWeb.ClientReadableStream<groups_pb.ListMembersRes>;

  listPlaces(
    request: groups_pb.ListPlacesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: groups_pb.ListPlacesRes) => void
  ): grpcWeb.ClientReadableStream<groups_pb.ListPlacesRes>;

  listGuides(
    request: groups_pb.ListGuidesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: groups_pb.ListGuidesRes) => void
  ): grpcWeb.ClientReadableStream<groups_pb.ListGuidesRes>;

  listEvents(
    request: groups_pb.ListEventsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: groups_pb.ListEventsRes) => void
  ): grpcWeb.ClientReadableStream<groups_pb.ListEventsRes>;

  listDiscussions(
    request: groups_pb.ListDiscussionsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: groups_pb.ListDiscussionsRes) => void
  ): grpcWeb.ClientReadableStream<groups_pb.ListDiscussionsRes>;

  joinGroup(
    request: groups_pb.JoinGroupReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  leaveGroup(
    request: groups_pb.LeaveGroupReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  listUserGroups(
    request: groups_pb.ListUserGroupsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: groups_pb.ListUserGroupsRes) => void
  ): grpcWeb.ClientReadableStream<groups_pb.ListUserGroupsRes>;

}

export class GroupsPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  getGroup(
    request: groups_pb.GetGroupReq,
    metadata?: grpcWeb.Metadata
  ): Promise<groups_pb.Group>;

  listAdmins(
    request: groups_pb.ListAdminsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<groups_pb.ListAdminsRes>;

  listMembers(
    request: groups_pb.ListMembersReq,
    metadata?: grpcWeb.Metadata
  ): Promise<groups_pb.ListMembersRes>;

  listPlaces(
    request: groups_pb.ListPlacesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<groups_pb.ListPlacesRes>;

  listGuides(
    request: groups_pb.ListGuidesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<groups_pb.ListGuidesRes>;

  listEvents(
    request: groups_pb.ListEventsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<groups_pb.ListEventsRes>;

  listDiscussions(
    request: groups_pb.ListDiscussionsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<groups_pb.ListDiscussionsRes>;

  joinGroup(
    request: groups_pb.JoinGroupReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  leaveGroup(
    request: groups_pb.LeaveGroupReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  listUserGroups(
    request: groups_pb.ListUserGroupsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<groups_pb.ListUserGroupsRes>;

}

