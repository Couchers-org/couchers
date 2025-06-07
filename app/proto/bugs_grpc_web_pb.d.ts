import * as grpcWeb from 'grpc-web';

import * as google_api_httpbody_pb from './google/api/httpbody_pb'; // proto import: "google/api/httpbody.proto"
import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as bugs_pb from './bugs_pb'; // proto import: "bugs.proto"


export class BugsClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  version(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: bugs_pb.VersionInfo) => void
  ): grpcWeb.ClientReadableStream<bugs_pb.VersionInfo>;

  reportBug(
    request: bugs_pb.ReportBugReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: bugs_pb.ReportBugRes) => void
  ): grpcWeb.ClientReadableStream<bugs_pb.ReportBugRes>;

  status(
    request: bugs_pb.StatusReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: bugs_pb.StatusRes) => void
  ): grpcWeb.ClientReadableStream<bugs_pb.StatusRes>;

  getDescriptors(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_api_httpbody_pb.HttpBody) => void
  ): grpcWeb.ClientReadableStream<google_api_httpbody_pb.HttpBody>;

}

export class BugsPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  version(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<bugs_pb.VersionInfo>;

  reportBug(
    request: bugs_pb.ReportBugReq,
    metadata?: grpcWeb.Metadata
  ): Promise<bugs_pb.ReportBugRes>;

  status(
    request: bugs_pb.StatusReq,
    metadata?: grpcWeb.Metadata
  ): Promise<bugs_pb.StatusRes>;

  getDescriptors(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<google_api_httpbody_pb.HttpBody>;

}

