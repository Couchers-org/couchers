import * as grpcWeb from 'grpc-web';

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as jail_pb from './jail_pb'; // proto import: "jail.proto"


export class JailClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  jailInfo(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: jail_pb.JailInfoRes) => void
  ): grpcWeb.ClientReadableStream<jail_pb.JailInfoRes>;

  acceptTOS(
    request: jail_pb.AcceptTOSReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: jail_pb.JailInfoRes) => void
  ): grpcWeb.ClientReadableStream<jail_pb.JailInfoRes>;

  setLocation(
    request: jail_pb.SetLocationReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: jail_pb.JailInfoRes) => void
  ): grpcWeb.ClientReadableStream<jail_pb.JailInfoRes>;

  acceptCommunityGuidelines(
    request: jail_pb.AcceptCommunityGuidelinesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: jail_pb.JailInfoRes) => void
  ): grpcWeb.ClientReadableStream<jail_pb.JailInfoRes>;

  acknowledgePendingModNote(
    request: jail_pb.AcknowledgePendingModNoteReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: jail_pb.JailInfoRes) => void
  ): grpcWeb.ClientReadableStream<jail_pb.JailInfoRes>;

  respondToActivenessProbe(
    request: jail_pb.RespondToActivenessProbeReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: jail_pb.JailInfoRes) => void
  ): grpcWeb.ClientReadableStream<jail_pb.JailInfoRes>;

}

export class JailPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  jailInfo(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<jail_pb.JailInfoRes>;

  acceptTOS(
    request: jail_pb.AcceptTOSReq,
    metadata?: grpcWeb.Metadata
  ): Promise<jail_pb.JailInfoRes>;

  setLocation(
    request: jail_pb.SetLocationReq,
    metadata?: grpcWeb.Metadata
  ): Promise<jail_pb.JailInfoRes>;

  acceptCommunityGuidelines(
    request: jail_pb.AcceptCommunityGuidelinesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<jail_pb.JailInfoRes>;

  acknowledgePendingModNote(
    request: jail_pb.AcknowledgePendingModNoteReq,
    metadata?: grpcWeb.Metadata
  ): Promise<jail_pb.JailInfoRes>;

  respondToActivenessProbe(
    request: jail_pb.RespondToActivenessProbeReq,
    metadata?: grpcWeb.Metadata
  ): Promise<jail_pb.JailInfoRes>;

}

