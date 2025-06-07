import * as grpcWeb from 'grpc-web';

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as api_pb from './api_pb'; // proto import: "api.proto"


export class APIClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  ping(
    request: api_pb.PingReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: api_pb.PingRes) => void
  ): grpcWeb.ClientReadableStream<api_pb.PingRes>;

  getUser(
    request: api_pb.GetUserReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: api_pb.User) => void
  ): grpcWeb.ClientReadableStream<api_pb.User>;

  getLiteUser(
    request: api_pb.GetLiteUserReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: api_pb.LiteUser) => void
  ): grpcWeb.ClientReadableStream<api_pb.LiteUser>;

  getLiteUsers(
    request: api_pb.GetLiteUsersReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: api_pb.GetLiteUsersRes) => void
  ): grpcWeb.ClientReadableStream<api_pb.GetLiteUsersRes>;

  updateProfile(
    request: api_pb.UpdateProfileReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  sendFriendRequest(
    request: api_pb.SendFriendRequestReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  listFriendRequests(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: api_pb.ListFriendRequestsRes) => void
  ): grpcWeb.ClientReadableStream<api_pb.ListFriendRequestsRes>;

  listFriends(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: api_pb.ListFriendsRes) => void
  ): grpcWeb.ClientReadableStream<api_pb.ListFriendsRes>;

  removeFriend(
    request: api_pb.RemoveFriendReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  listMutualFriends(
    request: api_pb.ListMutualFriendsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: api_pb.ListMutualFriendsRes) => void
  ): grpcWeb.ClientReadableStream<api_pb.ListMutualFriendsRes>;

  respondFriendRequest(
    request: api_pb.RespondFriendRequestReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  cancelFriendRequest(
    request: api_pb.CancelFriendRequestReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  initiateMediaUpload(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: api_pb.InitiateMediaUploadRes) => void
  ): grpcWeb.ClientReadableStream<api_pb.InitiateMediaUploadRes>;

  listBadgeUsers(
    request: api_pb.ListBadgeUsersReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: api_pb.ListBadgeUsersRes) => void
  ): grpcWeb.ClientReadableStream<api_pb.ListBadgeUsersRes>;

}

export class APIPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  ping(
    request: api_pb.PingReq,
    metadata?: grpcWeb.Metadata
  ): Promise<api_pb.PingRes>;

  getUser(
    request: api_pb.GetUserReq,
    metadata?: grpcWeb.Metadata
  ): Promise<api_pb.User>;

  getLiteUser(
    request: api_pb.GetLiteUserReq,
    metadata?: grpcWeb.Metadata
  ): Promise<api_pb.LiteUser>;

  getLiteUsers(
    request: api_pb.GetLiteUsersReq,
    metadata?: grpcWeb.Metadata
  ): Promise<api_pb.GetLiteUsersRes>;

  updateProfile(
    request: api_pb.UpdateProfileReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  sendFriendRequest(
    request: api_pb.SendFriendRequestReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  listFriendRequests(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<api_pb.ListFriendRequestsRes>;

  listFriends(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<api_pb.ListFriendsRes>;

  removeFriend(
    request: api_pb.RemoveFriendReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  listMutualFriends(
    request: api_pb.ListMutualFriendsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<api_pb.ListMutualFriendsRes>;

  respondFriendRequest(
    request: api_pb.RespondFriendRequestReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  cancelFriendRequest(
    request: api_pb.CancelFriendRequestReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  initiateMediaUpload(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<api_pb.InitiateMediaUploadRes>;

  listBadgeUsers(
    request: api_pb.ListBadgeUsersReq,
    metadata?: grpcWeb.Metadata
  ): Promise<api_pb.ListBadgeUsersRes>;

}

