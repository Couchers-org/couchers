import * as grpcWeb from 'grpc-web';

import * as google_api_httpbody_pb from './google/api/httpbody_pb'; // proto import: "google/api/httpbody.proto"


export class StripeClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  webhook(
    request: google_api_httpbody_pb.HttpBody,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_api_httpbody_pb.HttpBody) => void
  ): grpcWeb.ClientReadableStream<google_api_httpbody_pb.HttpBody>;

}

export class StripePromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  webhook(
    request: google_api_httpbody_pb.HttpBody,
    metadata?: grpcWeb.Metadata
  ): Promise<google_api_httpbody_pb.HttpBody>;

}

