import * as grpcWeb from 'grpc-web';

import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';
import * as google_protobuf_wrappers_pb from 'google-protobuf/google/protobuf/wrappers_pb';
import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';

import {
  CancelFriendRequestReq,
  GetUserReq,
  ListFriendRequestsRes,
  ListFriendsRes,
  PingReq,
  PingRes,
  RespondFriendRequestReq,
  SSOReq,
  SSORes,
  SearchReq,
  SearchRes,
  SendFriendRequestReq,
  UpdateProfileReq,
  UpdateProfileRes,
  User} from './api_pb';

export class APIClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: string; });

  ping(
    request: PingReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: PingRes) => void
  ): grpcWeb.ClientReadableStream<PingRes>;

  getUser(
    request: GetUserReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: User) => void
  ): grpcWeb.ClientReadableStream<User>;

  updateProfile(
    request: UpdateProfileReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: UpdateProfileRes) => void
  ): grpcWeb.ClientReadableStream<UpdateProfileRes>;

  sendFriendRequest(
    request: SendFriendRequestReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  listFriendRequests(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: ListFriendRequestsRes) => void
  ): grpcWeb.ClientReadableStream<ListFriendRequestsRes>;

  listFriends(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: ListFriendsRes) => void
  ): grpcWeb.ClientReadableStream<ListFriendsRes>;

  respondFriendRequest(
    request: RespondFriendRequestReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  cancelFriendRequest(
    request: CancelFriendRequestReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  sSO(
    request: SSOReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: SSORes) => void
  ): grpcWeb.ClientReadableStream<SSORes>;

  search(
    request: SearchReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: SearchRes) => void
  ): grpcWeb.ClientReadableStream<SearchRes>;

}

export class APIPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: string; });

  ping(
    request: PingReq,
    metadata?: grpcWeb.Metadata
  ): Promise<PingRes>;

  getUser(
    request: GetUserReq,
    metadata?: grpcWeb.Metadata
  ): Promise<User>;

  updateProfile(
    request: UpdateProfileReq,
    metadata?: grpcWeb.Metadata
  ): Promise<UpdateProfileRes>;

  sendFriendRequest(
    request: SendFriendRequestReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  listFriendRequests(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<ListFriendRequestsRes>;

  listFriends(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<ListFriendsRes>;

  respondFriendRequest(
    request: RespondFriendRequestReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  cancelFriendRequest(
    request: CancelFriendRequestReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  sSO(
    request: SSOReq,
    metadata?: grpcWeb.Metadata
  ): Promise<SSORes>;

  search(
    request: SearchReq,
    metadata?: grpcWeb.Metadata
  ): Promise<SearchRes>;

}

