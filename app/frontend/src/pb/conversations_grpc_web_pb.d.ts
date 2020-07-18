import * as grpcWeb from 'grpc-web';

import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';
import * as google_protobuf_wrappers_pb from 'google-protobuf/google/protobuf/wrappers_pb';
import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';

import {
  CreateMessageThreadReq,
  CreateMessageThreadRes,
  EditMessageThreadReq,
  EditMessageThreadStatusReq,
  GetMessageThreadInfoReq,
  GetMessageThreadInfoRes,
  GetMessageThreadReq,
  GetMessageThreadRes,
  LeaveMessageThreadReq,
  ListMessageThreadsReq,
  ListMessageThreadsRes,
  SearchMessagesReq,
  SearchMessagesRes,
  SendMessageReq,
  ThreadUserReq} from './conversations_pb';

export class ConversationsClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: string; });

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

export class ConversationsPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: string; });

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

