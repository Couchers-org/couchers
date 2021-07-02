import * as grpcWeb from 'grpc-web';

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';
import * as pb_requests_pb from '../pb/requests_pb';


export class RequestsClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  createHostRequest(
    request: pb_requests_pb.CreateHostRequestReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_requests_pb.CreateHostRequestRes) => void
  ): grpcWeb.ClientReadableStream<pb_requests_pb.CreateHostRequestRes>;

  getHostRequest(
    request: pb_requests_pb.GetHostRequestReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_requests_pb.HostRequest) => void
  ): grpcWeb.ClientReadableStream<pb_requests_pb.HostRequest>;

  respondHostRequest(
    request: pb_requests_pb.RespondHostRequestReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  listHostRequests(
    request: pb_requests_pb.ListHostRequestsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_requests_pb.ListHostRequestsRes) => void
  ): grpcWeb.ClientReadableStream<pb_requests_pb.ListHostRequestsRes>;

  getHostRequestMessages(
    request: pb_requests_pb.GetHostRequestMessagesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_requests_pb.GetHostRequestMessagesRes) => void
  ): grpcWeb.ClientReadableStream<pb_requests_pb.GetHostRequestMessagesRes>;

  sendHostRequestMessage(
    request: pb_requests_pb.SendHostRequestMessageReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  getHostRequestUpdates(
    request: pb_requests_pb.GetHostRequestUpdatesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_requests_pb.GetHostRequestUpdatesRes) => void
  ): grpcWeb.ClientReadableStream<pb_requests_pb.GetHostRequestUpdatesRes>;

  markLastSeenHostRequest(
    request: pb_requests_pb.MarkLastSeenHostRequestReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

}

export class RequestsPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  createHostRequest(
    request: pb_requests_pb.CreateHostRequestReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_requests_pb.CreateHostRequestRes>;

  getHostRequest(
    request: pb_requests_pb.GetHostRequestReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_requests_pb.HostRequest>;

  respondHostRequest(
    request: pb_requests_pb.RespondHostRequestReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  listHostRequests(
    request: pb_requests_pb.ListHostRequestsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_requests_pb.ListHostRequestsRes>;

  getHostRequestMessages(
    request: pb_requests_pb.GetHostRequestMessagesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_requests_pb.GetHostRequestMessagesRes>;

  sendHostRequestMessage(
    request: pb_requests_pb.SendHostRequestMessageReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  getHostRequestUpdates(
    request: pb_requests_pb.GetHostRequestUpdatesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_requests_pb.GetHostRequestUpdatesRes>;

  markLastSeenHostRequest(
    request: pb_requests_pb.MarkLastSeenHostRequestReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

}

