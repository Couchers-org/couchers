import * as grpcWeb from 'grpc-web';

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';
import * as pb_resources_pb from '../pb/resources_pb';


export class ResourcesClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  getTermsOfService(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_resources_pb.GetTermsOfServiceRes) => void
  ): grpcWeb.ClientReadableStream<pb_resources_pb.GetTermsOfServiceRes>;

  getRegions(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_resources_pb.GetRegionsRes) => void
  ): grpcWeb.ClientReadableStream<pb_resources_pb.GetRegionsRes>;

  getLanguages(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_resources_pb.GetLanguagesRes) => void
  ): grpcWeb.ClientReadableStream<pb_resources_pb.GetLanguagesRes>;

}

export class ResourcesPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  getTermsOfService(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_resources_pb.GetTermsOfServiceRes>;

  getRegions(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_resources_pb.GetRegionsRes>;

  getLanguages(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_resources_pb.GetLanguagesRes>;

}

