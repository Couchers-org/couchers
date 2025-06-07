import * as grpcWeb from 'grpc-web';

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as requests_pb from './requests_pb'; // proto import: "requests.proto"


export class RequestsClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  createHostRequest(
    request: requests_pb.CreateHostRequestReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: requests_pb.CreateHostRequestRes) => void
  ): grpcWeb.ClientReadableStream<requests_pb.CreateHostRequestRes>;

  getHostRequest(
    request: requests_pb.GetHostRequestReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: requests_pb.HostRequest) => void
  ): grpcWeb.ClientReadableStream<requests_pb.HostRequest>;

  respondHostRequest(
    request: requests_pb.RespondHostRequestReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  listHostRequests(
    request: requests_pb.ListHostRequestsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: requests_pb.ListHostRequestsRes) => void
  ): grpcWeb.ClientReadableStream<requests_pb.ListHostRequestsRes>;

  getHostRequestMessages(
    request: requests_pb.GetHostRequestMessagesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: requests_pb.GetHostRequestMessagesRes) => void
  ): grpcWeb.ClientReadableStream<requests_pb.GetHostRequestMessagesRes>;

  sendHostRequestMessage(
    request: requests_pb.SendHostRequestMessageReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  getHostRequestUpdates(
    request: requests_pb.GetHostRequestUpdatesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: requests_pb.GetHostRequestUpdatesRes) => void
  ): grpcWeb.ClientReadableStream<requests_pb.GetHostRequestUpdatesRes>;

  markLastSeenHostRequest(
    request: requests_pb.MarkLastSeenHostRequestReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  getResponseRate(
    request: requests_pb.GetResponseRateReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: requests_pb.GetResponseRateRes) => void
  ): grpcWeb.ClientReadableStream<requests_pb.GetResponseRateRes>;

}

export class RequestsPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  createHostRequest(
    request: requests_pb.CreateHostRequestReq,
    metadata?: grpcWeb.Metadata
  ): Promise<requests_pb.CreateHostRequestRes>;

  getHostRequest(
    request: requests_pb.GetHostRequestReq,
    metadata?: grpcWeb.Metadata
  ): Promise<requests_pb.HostRequest>;

  respondHostRequest(
    request: requests_pb.RespondHostRequestReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  listHostRequests(
    request: requests_pb.ListHostRequestsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<requests_pb.ListHostRequestsRes>;

  getHostRequestMessages(
    request: requests_pb.GetHostRequestMessagesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<requests_pb.GetHostRequestMessagesRes>;

  sendHostRequestMessage(
    request: requests_pb.SendHostRequestMessageReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  getHostRequestUpdates(
    request: requests_pb.GetHostRequestUpdatesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<requests_pb.GetHostRequestUpdatesRes>;

  markLastSeenHostRequest(
    request: requests_pb.MarkLastSeenHostRequestReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  getResponseRate(
    request: requests_pb.GetResponseRateReq,
    metadata?: grpcWeb.Metadata
  ): Promise<requests_pb.GetResponseRateRes>;

}

