import * as grpcWeb from 'grpc-web';

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';
import * as pb_google_api_httpbody_pb from '../pb/google/api/httpbody_pb';


export class GISClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  getUsers(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_google_api_httpbody_pb.HttpBody) => void
  ): grpcWeb.ClientReadableStream<pb_google_api_httpbody_pb.HttpBody>;

  getCommunities(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_google_api_httpbody_pb.HttpBody) => void
  ): grpcWeb.ClientReadableStream<pb_google_api_httpbody_pb.HttpBody>;

  getPlaces(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_google_api_httpbody_pb.HttpBody) => void
  ): grpcWeb.ClientReadableStream<pb_google_api_httpbody_pb.HttpBody>;

  getGuides(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_google_api_httpbody_pb.HttpBody) => void
  ): grpcWeb.ClientReadableStream<pb_google_api_httpbody_pb.HttpBody>;

}

export class GISPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  getUsers(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_google_api_httpbody_pb.HttpBody>;

  getCommunities(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_google_api_httpbody_pb.HttpBody>;

  getPlaces(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_google_api_httpbody_pb.HttpBody>;

  getGuides(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_google_api_httpbody_pb.HttpBody>;

}

