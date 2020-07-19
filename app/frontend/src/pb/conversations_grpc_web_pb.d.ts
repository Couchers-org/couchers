import * as grpcWeb from 'grpc-web';

import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';
import * as google_protobuf_wrappers_pb from 'google-protobuf/google/protobuf/wrappers_pb';
import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';

import {
  CreateGroupChatReq,
  EditGroupChatReq,
  GetGroupChatMessagesReq,
  GetGroupChatMessagesRes,
  GetGroupChatReq,
  GroupChat,
  LeaveGroupChatReq,
  ListGroupChatsReq,
  ListGroupChatsRes,
  MakeGroupChatAdminReq,
  RemoveGroupChatAdminReq,
  SearchMessagesReq,
  SearchMessagesRes,
  SendMessageReq} from './conversations_pb';

export class ConversationsClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: string; });

  listGroupChats(
    request: ListGroupChatsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: ListGroupChatsRes) => void
  ): grpcWeb.ClientReadableStream<ListGroupChatsRes>;

  getGroupChat(
    request: GetGroupChatReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: GroupChat) => void
  ): grpcWeb.ClientReadableStream<GroupChat>;

  getGroupChatMessages(
    request: GetGroupChatMessagesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: GetGroupChatMessagesRes) => void
  ): grpcWeb.ClientReadableStream<GetGroupChatMessagesRes>;

  createGroupChat(
    request: CreateGroupChatReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: GroupChat) => void
  ): grpcWeb.ClientReadableStream<GroupChat>;

  editGroupChat(
    request: EditGroupChatReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  makeGroupChatAdmin(
    request: MakeGroupChatAdminReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  removeGroupChatAdmin(
    request: RemoveGroupChatAdminReq,
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

  leaveGroupChat(
    request: LeaveGroupChatReq,
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

export class ConversationsPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: string; });

  listGroupChats(
    request: ListGroupChatsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<ListGroupChatsRes>;

  getGroupChat(
    request: GetGroupChatReq,
    metadata?: grpcWeb.Metadata
  ): Promise<GroupChat>;

  getGroupChatMessages(
    request: GetGroupChatMessagesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<GetGroupChatMessagesRes>;

  createGroupChat(
    request: CreateGroupChatReq,
    metadata?: grpcWeb.Metadata
  ): Promise<GroupChat>;

  editGroupChat(
    request: EditGroupChatReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  makeGroupChatAdmin(
    request: MakeGroupChatAdminReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  removeGroupChatAdmin(
    request: RemoveGroupChatAdminReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  sendMessage(
    request: SendMessageReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  leaveGroupChat(
    request: LeaveGroupChatReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  searchMessages(
    request: SearchMessagesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<SearchMessagesRes>;

}

