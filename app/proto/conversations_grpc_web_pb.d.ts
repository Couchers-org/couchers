import * as grpcWeb from 'grpc-web';

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as conversations_pb from './conversations_pb'; // proto import: "conversations.proto"


export class ConversationsClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  listGroupChats(
    request: conversations_pb.ListGroupChatsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: conversations_pb.ListGroupChatsRes) => void
  ): grpcWeb.ClientReadableStream<conversations_pb.ListGroupChatsRes>;

  getGroupChat(
    request: conversations_pb.GetGroupChatReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: conversations_pb.GroupChat) => void
  ): grpcWeb.ClientReadableStream<conversations_pb.GroupChat>;

  getDirectMessage(
    request: conversations_pb.GetDirectMessageReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: conversations_pb.GroupChat) => void
  ): grpcWeb.ClientReadableStream<conversations_pb.GroupChat>;

  getUpdates(
    request: conversations_pb.GetUpdatesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: conversations_pb.GetUpdatesRes) => void
  ): grpcWeb.ClientReadableStream<conversations_pb.GetUpdatesRes>;

  getGroupChatMessages(
    request: conversations_pb.GetGroupChatMessagesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: conversations_pb.GetGroupChatMessagesRes) => void
  ): grpcWeb.ClientReadableStream<conversations_pb.GetGroupChatMessagesRes>;

  markLastSeenGroupChat(
    request: conversations_pb.MarkLastSeenGroupChatReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  muteGroupChat(
    request: conversations_pb.MuteGroupChatReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  createGroupChat(
    request: conversations_pb.CreateGroupChatReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: conversations_pb.GroupChat) => void
  ): grpcWeb.ClientReadableStream<conversations_pb.GroupChat>;

  editGroupChat(
    request: conversations_pb.EditGroupChatReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  inviteToGroupChat(
    request: conversations_pb.InviteToGroupChatReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  makeGroupChatAdmin(
    request: conversations_pb.MakeGroupChatAdminReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  removeGroupChatUser(
    request: conversations_pb.RemoveGroupChatUserReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  removeGroupChatAdmin(
    request: conversations_pb.RemoveGroupChatAdminReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  sendMessage(
    request: conversations_pb.SendMessageReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  leaveGroupChat(
    request: conversations_pb.LeaveGroupChatReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  searchMessages(
    request: conversations_pb.SearchMessagesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: conversations_pb.SearchMessagesRes) => void
  ): grpcWeb.ClientReadableStream<conversations_pb.SearchMessagesRes>;

}

export class ConversationsPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  listGroupChats(
    request: conversations_pb.ListGroupChatsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<conversations_pb.ListGroupChatsRes>;

  getGroupChat(
    request: conversations_pb.GetGroupChatReq,
    metadata?: grpcWeb.Metadata
  ): Promise<conversations_pb.GroupChat>;

  getDirectMessage(
    request: conversations_pb.GetDirectMessageReq,
    metadata?: grpcWeb.Metadata
  ): Promise<conversations_pb.GroupChat>;

  getUpdates(
    request: conversations_pb.GetUpdatesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<conversations_pb.GetUpdatesRes>;

  getGroupChatMessages(
    request: conversations_pb.GetGroupChatMessagesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<conversations_pb.GetGroupChatMessagesRes>;

  markLastSeenGroupChat(
    request: conversations_pb.MarkLastSeenGroupChatReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  muteGroupChat(
    request: conversations_pb.MuteGroupChatReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  createGroupChat(
    request: conversations_pb.CreateGroupChatReq,
    metadata?: grpcWeb.Metadata
  ): Promise<conversations_pb.GroupChat>;

  editGroupChat(
    request: conversations_pb.EditGroupChatReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  inviteToGroupChat(
    request: conversations_pb.InviteToGroupChatReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  makeGroupChatAdmin(
    request: conversations_pb.MakeGroupChatAdminReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  removeGroupChatUser(
    request: conversations_pb.RemoveGroupChatUserReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  removeGroupChatAdmin(
    request: conversations_pb.RemoveGroupChatAdminReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  sendMessage(
    request: conversations_pb.SendMessageReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  leaveGroupChat(
    request: conversations_pb.LeaveGroupChatReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  searchMessages(
    request: conversations_pb.SearchMessagesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<conversations_pb.SearchMessagesRes>;

}

