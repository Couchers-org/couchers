import * as grpcWeb from 'grpc-web';

import * as google_api_httpbody_pb from './google/api/httpbody_pb'; // proto import: "google/api/httpbody.proto"
import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"


export class GISClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  getUsers(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_api_httpbody_pb.HttpBody) => void
  ): grpcWeb.ClientReadableStream<google_api_httpbody_pb.HttpBody>;

  getClusteredUsers(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_api_httpbody_pb.HttpBody) => void
  ): grpcWeb.ClientReadableStream<google_api_httpbody_pb.HttpBody>;

  getCommunities(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_api_httpbody_pb.HttpBody) => void
  ): grpcWeb.ClientReadableStream<google_api_httpbody_pb.HttpBody>;

  getPlaces(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_api_httpbody_pb.HttpBody) => void
  ): grpcWeb.ClientReadableStream<google_api_httpbody_pb.HttpBody>;

  getGuides(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_api_httpbody_pb.HttpBody) => void
  ): grpcWeb.ClientReadableStream<google_api_httpbody_pb.HttpBody>;

}

export class GISPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  getUsers(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<google_api_httpbody_pb.HttpBody>;

  getClusteredUsers(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<google_api_httpbody_pb.HttpBody>;

  getCommunities(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<google_api_httpbody_pb.HttpBody>;

  getPlaces(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<google_api_httpbody_pb.HttpBody>;

  getGuides(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<google_api_httpbody_pb.HttpBody>;

}

