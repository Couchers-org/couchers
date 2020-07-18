import * as grpcWeb from 'grpc-web';

import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';
import * as google_protobuf_wrappers_pb from 'google-protobuf/google/protobuf/wrappers_pb';
import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';

import {
  CancelFriendRequestReq,
  CreateMessageThreadReq,
  CreateMessageThreadRes,
  EditMessageThreadReq,
  EditMessageThreadStatusReq,
  GetMessageThreadInfoReq,
  GetMessageThreadInfoRes,
  GetMessageThreadReq,
  GetMessageThreadRes,
  GetUserReq,
  LeaveMessageThreadReq,
  ListFriendRequestsRes,
  ListFriendsRes,
  ListMessageThreadsReq,
  ListMessageThreadsRes,
  PingReq,
  PingRes,
  RespondFriendRequestReq,
  SSOReq,
  SSORes,
  SearchMessagesReq,
  SearchMessagesRes,
  SearchReq,
  SearchRes,
  SendFriendRequestReq,
  SendMessageReq,
  ThreadUserReq,
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

  listMessageThreads(
    request: ListMessageThreadsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: ListMessageThreadsRes) => void
  ): grpcWeb.ClientReadableStream<ListMessageThreadsRes>;

  editMessageThreadStatus(
    request: EditMessageThreadStatusReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  getMessageThread(
    request: GetMessageThreadReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: GetMessageThreadRes) => void
  ): grpcWeb.ClientReadableStream<GetMessageThreadRes>;

  getMessageThreadInfo(
    request: GetMessageThreadInfoReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: GetMessageThreadInfoRes) => void
  ): grpcWeb.ClientReadableStream<GetMessageThreadInfoRes>;

  createMessageThread(
    request: CreateMessageThreadReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: CreateMessageThreadRes) => void
  ): grpcWeb.ClientReadableStream<CreateMessageThreadRes>;

  editMessageThread(
    request: EditMessageThreadReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  makeMessageThreadAdmin(
    request: ThreadUserReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  removeMessageThreadAdmin(
    request: ThreadUserReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  sendMessage(
    request: SendMessageReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  leaveMessageThread(
    request: LeaveMessageThreadReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  inviteToMessageThread(
    request: ThreadUserReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  searchMessages(
    request: SearchMessagesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: SearchMessagesRes) => void
  ): grpcWeb.ClientReadableStream<SearchMessagesRes>;

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

  listMessageThreads(
    request: ListMessageThreadsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<ListMessageThreadsRes>;

  editMessageThreadStatus(
    request: EditMessageThreadStatusReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  getMessageThread(
    request: GetMessageThreadReq,
    metadata?: grpcWeb.Metadata
  ): Promise<GetMessageThreadRes>;

  getMessageThreadInfo(
    request: GetMessageThreadInfoReq,
    metadata?: grpcWeb.Metadata
  ): Promise<GetMessageThreadInfoRes>;

  createMessageThread(
    request: CreateMessageThreadReq,
    metadata?: grpcWeb.Metadata
  ): Promise<CreateMessageThreadRes>;

  editMessageThread(
    request: EditMessageThreadReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  makeMessageThreadAdmin(
    request: ThreadUserReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  removeMessageThreadAdmin(
    request: ThreadUserReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  sendMessage(
    request: SendMessageReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  leaveMessageThread(
    request: LeaveMessageThreadReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  inviteToMessageThread(
    request: ThreadUserReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  searchMessages(
    request: SearchMessagesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<SearchMessagesRes>;

}

