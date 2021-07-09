import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as grpcWeb from "grpc-web";

import * as pb_conversations_pb from "../pb/conversations_pb";

export class ConversationsClient {
  constructor(
    hostname: string,
    credentials?: null | { [index: string]: string },
    options?: null | { [index: string]: any }
  );

  listGroupChats(
    request: pb_conversations_pb.ListGroupChatsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: pb_conversations_pb.ListGroupChatsRes
    ) => void
  ): grpcWeb.ClientReadableStream<pb_conversations_pb.ListGroupChatsRes>;

  getGroupChat(
    request: pb_conversations_pb.GetGroupChatReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: pb_conversations_pb.GroupChat
    ) => void
  ): grpcWeb.ClientReadableStream<pb_conversations_pb.GroupChat>;

  getDirectMessage(
    request: pb_conversations_pb.GetDirectMessageReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: pb_conversations_pb.GroupChat
    ) => void
  ): grpcWeb.ClientReadableStream<pb_conversations_pb.GroupChat>;

  getUpdates(
    request: pb_conversations_pb.GetUpdatesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: pb_conversations_pb.GetUpdatesRes
    ) => void
  ): grpcWeb.ClientReadableStream<pb_conversations_pb.GetUpdatesRes>;

  getGroupChatMessages(
    request: pb_conversations_pb.GetGroupChatMessagesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: pb_conversations_pb.GetGroupChatMessagesRes
    ) => void
  ): grpcWeb.ClientReadableStream<pb_conversations_pb.GetGroupChatMessagesRes>;

  markLastSeenGroupChat(
    request: pb_conversations_pb.MarkLastSeenGroupChatReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: google_protobuf_empty_pb.Empty
    ) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  createGroupChat(
    request: pb_conversations_pb.CreateGroupChatReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: pb_conversations_pb.GroupChat
    ) => void
  ): grpcWeb.ClientReadableStream<pb_conversations_pb.GroupChat>;

  editGroupChat(
    request: pb_conversations_pb.EditGroupChatReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: google_protobuf_empty_pb.Empty
    ) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  inviteToGroupChat(
    request: pb_conversations_pb.InviteToGroupChatReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: google_protobuf_empty_pb.Empty
    ) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  makeGroupChatAdmin(
    request: pb_conversations_pb.MakeGroupChatAdminReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: google_protobuf_empty_pb.Empty
    ) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  removeGroupChatUser(
    request: pb_conversations_pb.RemoveGroupChatUserReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: google_protobuf_empty_pb.Empty
    ) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  removeGroupChatAdmin(
    request: pb_conversations_pb.RemoveGroupChatAdminReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: google_protobuf_empty_pb.Empty
    ) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  sendMessage(
    request: pb_conversations_pb.SendMessageReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: google_protobuf_empty_pb.Empty
    ) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  leaveGroupChat(
    request: pb_conversations_pb.LeaveGroupChatReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: google_protobuf_empty_pb.Empty
    ) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  searchMessages(
    request: pb_conversations_pb.SearchMessagesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: pb_conversations_pb.SearchMessagesRes
    ) => void
  ): grpcWeb.ClientReadableStream<pb_conversations_pb.SearchMessagesRes>;
}

export class ConversationsPromiseClient {
  constructor(
    hostname: string,
    credentials?: null | { [index: string]: string },
    options?: null | { [index: string]: any }
  );

  listGroupChats(
    request: pb_conversations_pb.ListGroupChatsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_conversations_pb.ListGroupChatsRes>;

  getGroupChat(
    request: pb_conversations_pb.GetGroupChatReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_conversations_pb.GroupChat>;

  getDirectMessage(
    request: pb_conversations_pb.GetDirectMessageReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_conversations_pb.GroupChat>;

  getUpdates(
    request: pb_conversations_pb.GetUpdatesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_conversations_pb.GetUpdatesRes>;

  getGroupChatMessages(
    request: pb_conversations_pb.GetGroupChatMessagesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_conversations_pb.GetGroupChatMessagesRes>;

  markLastSeenGroupChat(
    request: pb_conversations_pb.MarkLastSeenGroupChatReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  createGroupChat(
    request: pb_conversations_pb.CreateGroupChatReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_conversations_pb.GroupChat>;

  editGroupChat(
    request: pb_conversations_pb.EditGroupChatReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  inviteToGroupChat(
    request: pb_conversations_pb.InviteToGroupChatReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  makeGroupChatAdmin(
    request: pb_conversations_pb.MakeGroupChatAdminReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  removeGroupChatUser(
    request: pb_conversations_pb.RemoveGroupChatUserReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  removeGroupChatAdmin(
    request: pb_conversations_pb.RemoveGroupChatAdminReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  sendMessage(
    request: pb_conversations_pb.SendMessageReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  leaveGroupChat(
    request: pb_conversations_pb.LeaveGroupChatReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  searchMessages(
    request: pb_conversations_pb.SearchMessagesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_conversations_pb.SearchMessagesRes>;
}
