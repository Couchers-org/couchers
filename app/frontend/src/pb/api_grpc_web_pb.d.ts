import * as grpcWeb from 'grpc-web';

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';
import * as pb_api_pb from '../pb/api_pb';


export class APIClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  ping(
    request: pb_api_pb.PingReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_api_pb.PingRes) => void
  ): grpcWeb.ClientReadableStream<pb_api_pb.PingRes>;

  getUser(
    request: pb_api_pb.GetUserReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_api_pb.User) => void
  ): grpcWeb.ClientReadableStream<pb_api_pb.User>;

  updateProfile(
    request: pb_api_pb.UpdateProfileReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  sendFriendRequest(
    request: pb_api_pb.SendFriendRequestReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  listFriendRequests(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_api_pb.ListFriendRequestsRes) => void
  ): grpcWeb.ClientReadableStream<pb_api_pb.ListFriendRequestsRes>;

  listFriends(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_api_pb.ListFriendsRes) => void
  ): grpcWeb.ClientReadableStream<pb_api_pb.ListFriendsRes>;

  listMutualFriends(
    request: pb_api_pb.ListMutualFriendsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_api_pb.ListMutualFriendsRes) => void
  ): grpcWeb.ClientReadableStream<pb_api_pb.ListMutualFriendsRes>;

  respondFriendRequest(
    request: pb_api_pb.RespondFriendRequestReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  cancelFriendRequest(
    request: pb_api_pb.CancelFriendRequestReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  report(
    request: pb_api_pb.ReportReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  initiateMediaUpload(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_api_pb.InitiateMediaUploadRes) => void
  ): grpcWeb.ClientReadableStream<pb_api_pb.InitiateMediaUploadRes>;

}

export class APIPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  ping(
    request: pb_api_pb.PingReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_api_pb.PingRes>;

  getUser(
    request: pb_api_pb.GetUserReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_api_pb.User>;

  updateProfile(
    request: pb_api_pb.UpdateProfileReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  sendFriendRequest(
    request: pb_api_pb.SendFriendRequestReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  listFriendRequests(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_api_pb.ListFriendRequestsRes>;

  listFriends(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_api_pb.ListFriendsRes>;

  listMutualFriends(
    request: pb_api_pb.ListMutualFriendsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_api_pb.ListMutualFriendsRes>;

  respondFriendRequest(
    request: pb_api_pb.RespondFriendRequestReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  cancelFriendRequest(
    request: pb_api_pb.CancelFriendRequestReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  report(
    request: pb_api_pb.ReportReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  initiateMediaUpload(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_api_pb.InitiateMediaUploadRes>;

}

