import * as grpcWeb from 'grpc-web';

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';
import * as pb_jail_pb from '../pb/jail_pb';


export class JailClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  jailInfo(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_jail_pb.JailInfoRes) => void
  ): grpcWeb.ClientReadableStream<pb_jail_pb.JailInfoRes>;

  acceptTOS(
    request: pb_jail_pb.AcceptTOSReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_jail_pb.JailInfoRes) => void
  ): grpcWeb.ClientReadableStream<pb_jail_pb.JailInfoRes>;

  setLocation(
    request: pb_jail_pb.SetLocationReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_jail_pb.JailInfoRes) => void
  ): grpcWeb.ClientReadableStream<pb_jail_pb.JailInfoRes>;

}

export class JailPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  jailInfo(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_jail_pb.JailInfoRes>;

  acceptTOS(
    request: pb_jail_pb.AcceptTOSReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_jail_pb.JailInfoRes>;

  setLocation(
    request: pb_jail_pb.SetLocationReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_jail_pb.JailInfoRes>;

}

