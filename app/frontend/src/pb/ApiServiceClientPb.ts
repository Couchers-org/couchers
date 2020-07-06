/**
 * @fileoverview gRPC-Web generated client stub for api
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!


/* eslint-disable */
// @ts-nocheck


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
  client_: grpcWeb.AbstractClientBase;
  hostname_: string;
  credentials_: null | { [index: string]: string; };
  options_: null | { [index: string]: string; };

  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: string; }) {
    if (!options) options = {};
    if (!credentials) credentials = {};
    options['format'] = 'binary';

    this.client_ = new grpcWeb.GrpcWebClientBase(options);
    this.hostname_ = hostname;
    this.credentials_ = credentials;
    this.options_ = options;
  }

  methodInfoPing = new grpcWeb.AbstractClientBase.MethodInfo(
    PingRes,
    (request: PingReq) => {
      return request.serializeBinary();
    },
    PingRes.deserializeBinary
  );

  ping(
    request: PingReq,
    metadata: grpcWeb.Metadata | null): Promise<PingRes>;

  ping(
    request: PingReq,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: PingRes) => void): grpcWeb.ClientReadableStream<PingRes>;

  ping(
    request: PingReq,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: PingRes) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/api.API/Ping',
        request,
        metadata || {},
        this.methodInfoPing,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/api.API/Ping',
    request,
    metadata || {},
    this.methodInfoPing);
  }

  methodInfoGetUser = new grpcWeb.AbstractClientBase.MethodInfo(
    User,
    (request: GetUserReq) => {
      return request.serializeBinary();
    },
    User.deserializeBinary
  );

  getUser(
    request: GetUserReq,
    metadata: grpcWeb.Metadata | null): Promise<User>;

  getUser(
    request: GetUserReq,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: User) => void): grpcWeb.ClientReadableStream<User>;

  getUser(
    request: GetUserReq,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: User) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/api.API/GetUser',
        request,
        metadata || {},
        this.methodInfoGetUser,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/api.API/GetUser',
    request,
    metadata || {},
    this.methodInfoGetUser);
  }

  methodInfoUpdateProfile = new grpcWeb.AbstractClientBase.MethodInfo(
    UpdateProfileRes,
    (request: UpdateProfileReq) => {
      return request.serializeBinary();
    },
    UpdateProfileRes.deserializeBinary
  );

  updateProfile(
    request: UpdateProfileReq,
    metadata: grpcWeb.Metadata | null): Promise<UpdateProfileRes>;

  updateProfile(
    request: UpdateProfileReq,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: UpdateProfileRes) => void): grpcWeb.ClientReadableStream<UpdateProfileRes>;

  updateProfile(
    request: UpdateProfileReq,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: UpdateProfileRes) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/api.API/UpdateProfile',
        request,
        metadata || {},
        this.methodInfoUpdateProfile,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/api.API/UpdateProfile',
    request,
    metadata || {},
    this.methodInfoUpdateProfile);
  }

  methodInfoSendFriendRequest = new grpcWeb.AbstractClientBase.MethodInfo(
    google_protobuf_empty_pb.Empty,
    (request: SendFriendRequestReq) => {
      return request.serializeBinary();
    },
    google_protobuf_empty_pb.Empty.deserializeBinary
  );

  sendFriendRequest(
    request: SendFriendRequestReq,
    metadata: grpcWeb.Metadata | null): Promise<google_protobuf_empty_pb.Empty>;

  sendFriendRequest(
    request: SendFriendRequestReq,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  sendFriendRequest(
    request: SendFriendRequestReq,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/api.API/SendFriendRequest',
        request,
        metadata || {},
        this.methodInfoSendFriendRequest,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/api.API/SendFriendRequest',
    request,
    metadata || {},
    this.methodInfoSendFriendRequest);
  }

  methodInfoListFriendRequests = new grpcWeb.AbstractClientBase.MethodInfo(
    ListFriendRequestsRes,
    (request: google_protobuf_empty_pb.Empty) => {
      return request.serializeBinary();
    },
    ListFriendRequestsRes.deserializeBinary
  );

  listFriendRequests(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | null): Promise<ListFriendRequestsRes>;

  listFriendRequests(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: ListFriendRequestsRes) => void): grpcWeb.ClientReadableStream<ListFriendRequestsRes>;

  listFriendRequests(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: ListFriendRequestsRes) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/api.API/ListFriendRequests',
        request,
        metadata || {},
        this.methodInfoListFriendRequests,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/api.API/ListFriendRequests',
    request,
    metadata || {},
    this.methodInfoListFriendRequests);
  }

  methodInfoListFriends = new grpcWeb.AbstractClientBase.MethodInfo(
    ListFriendsRes,
    (request: google_protobuf_empty_pb.Empty) => {
      return request.serializeBinary();
    },
    ListFriendsRes.deserializeBinary
  );

  listFriends(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | null): Promise<ListFriendsRes>;

  listFriends(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: ListFriendsRes) => void): grpcWeb.ClientReadableStream<ListFriendsRes>;

  listFriends(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: ListFriendsRes) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/api.API/ListFriends',
        request,
        metadata || {},
        this.methodInfoListFriends,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/api.API/ListFriends',
    request,
    metadata || {},
    this.methodInfoListFriends);
  }

  methodInfoRespondFriendRequest = new grpcWeb.AbstractClientBase.MethodInfo(
    google_protobuf_empty_pb.Empty,
    (request: RespondFriendRequestReq) => {
      return request.serializeBinary();
    },
    google_protobuf_empty_pb.Empty.deserializeBinary
  );

  respondFriendRequest(
    request: RespondFriendRequestReq,
    metadata: grpcWeb.Metadata | null): Promise<google_protobuf_empty_pb.Empty>;

  respondFriendRequest(
    request: RespondFriendRequestReq,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  respondFriendRequest(
    request: RespondFriendRequestReq,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/api.API/RespondFriendRequest',
        request,
        metadata || {},
        this.methodInfoRespondFriendRequest,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/api.API/RespondFriendRequest',
    request,
    metadata || {},
    this.methodInfoRespondFriendRequest);
  }

  methodInfoCancelFriendRequest = new grpcWeb.AbstractClientBase.MethodInfo(
    google_protobuf_empty_pb.Empty,
    (request: CancelFriendRequestReq) => {
      return request.serializeBinary();
    },
    google_protobuf_empty_pb.Empty.deserializeBinary
  );

  cancelFriendRequest(
    request: CancelFriendRequestReq,
    metadata: grpcWeb.Metadata | null): Promise<google_protobuf_empty_pb.Empty>;

  cancelFriendRequest(
    request: CancelFriendRequestReq,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  cancelFriendRequest(
    request: CancelFriendRequestReq,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/api.API/CancelFriendRequest',
        request,
        metadata || {},
        this.methodInfoCancelFriendRequest,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/api.API/CancelFriendRequest',
    request,
    metadata || {},
    this.methodInfoCancelFriendRequest);
  }

  methodInfoSSO = new grpcWeb.AbstractClientBase.MethodInfo(
    SSORes,
    (request: SSOReq) => {
      return request.serializeBinary();
    },
    SSORes.deserializeBinary
  );

  sSO(
    request: SSOReq,
    metadata: grpcWeb.Metadata | null): Promise<SSORes>;

  sSO(
    request: SSOReq,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: SSORes) => void): grpcWeb.ClientReadableStream<SSORes>;

  sSO(
    request: SSOReq,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: SSORes) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/api.API/SSO',
        request,
        metadata || {},
        this.methodInfoSSO,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/api.API/SSO',
    request,
    metadata || {},
    this.methodInfoSSO);
  }

  methodInfoSearch = new grpcWeb.AbstractClientBase.MethodInfo(
    SearchRes,
    (request: SearchReq) => {
      return request.serializeBinary();
    },
    SearchRes.deserializeBinary
  );

  search(
    request: SearchReq,
    metadata: grpcWeb.Metadata | null): Promise<SearchRes>;

  search(
    request: SearchReq,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: SearchRes) => void): grpcWeb.ClientReadableStream<SearchRes>;

  search(
    request: SearchReq,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: SearchRes) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/api.API/Search',
        request,
        metadata || {},
        this.methodInfoSearch,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/api.API/Search',
    request,
    metadata || {},
    this.methodInfoSearch);
  }

}

