import * as grpcWeb from 'grpc-web';

import * as google_api_httpbody_pb from './google/api/httpbody_pb'; // proto import: "google/api/httpbody.proto"
import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as public_pb from './public_pb'; // proto import: "public.proto"


export class PublicClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  getPublicUsers(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_api_httpbody_pb.HttpBody) => void
  ): grpcWeb.ClientReadableStream<google_api_httpbody_pb.HttpBody>;

  getPublicUser(
    request: public_pb.GetPublicUserReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: public_pb.GetPublicUserRes) => void
  ): grpcWeb.ClientReadableStream<public_pb.GetPublicUserRes>;

  getSignupPageInfo(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: public_pb.GetSignupPageInfoRes) => void
  ): grpcWeb.ClientReadableStream<public_pb.GetSignupPageInfoRes>;

}

export class PublicPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  getPublicUsers(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<google_api_httpbody_pb.HttpBody>;

  getPublicUser(
    request: public_pb.GetPublicUserReq,
    metadata?: grpcWeb.Metadata
  ): Promise<public_pb.GetPublicUserRes>;

  getSignupPageInfo(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<public_pb.GetSignupPageInfoRes>;

}

