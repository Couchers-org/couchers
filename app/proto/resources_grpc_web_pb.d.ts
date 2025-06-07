import * as grpcWeb from 'grpc-web';

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as resources_pb from './resources_pb'; // proto import: "resources.proto"


export class ResourcesClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  getTermsOfService(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: resources_pb.GetTermsOfServiceRes) => void
  ): grpcWeb.ClientReadableStream<resources_pb.GetTermsOfServiceRes>;

  getCommunityGuidelines(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: resources_pb.GetCommunityGuidelinesRes) => void
  ): grpcWeb.ClientReadableStream<resources_pb.GetCommunityGuidelinesRes>;

  getRegions(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: resources_pb.GetRegionsRes) => void
  ): grpcWeb.ClientReadableStream<resources_pb.GetRegionsRes>;

  getLanguages(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: resources_pb.GetLanguagesRes) => void
  ): grpcWeb.ClientReadableStream<resources_pb.GetLanguagesRes>;

  getBadges(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: resources_pb.GetBadgesRes) => void
  ): grpcWeb.ClientReadableStream<resources_pb.GetBadgesRes>;

}

export class ResourcesPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  getTermsOfService(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<resources_pb.GetTermsOfServiceRes>;

  getCommunityGuidelines(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<resources_pb.GetCommunityGuidelinesRes>;

  getRegions(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<resources_pb.GetRegionsRes>;

  getLanguages(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<resources_pb.GetLanguagesRes>;

  getBadges(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<resources_pb.GetBadgesRes>;

}

