import * as grpcWeb from 'grpc-web';

import * as discussions_pb from './discussions_pb'; // proto import: "discussions.proto"


export class DiscussionsClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  createDiscussion(
    request: discussions_pb.CreateDiscussionReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: discussions_pb.Discussion) => void
  ): grpcWeb.ClientReadableStream<discussions_pb.Discussion>;

  getDiscussion(
    request: discussions_pb.GetDiscussionReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: discussions_pb.Discussion) => void
  ): grpcWeb.ClientReadableStream<discussions_pb.Discussion>;

}

export class DiscussionsPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  createDiscussion(
    request: discussions_pb.CreateDiscussionReq,
    metadata?: grpcWeb.Metadata
  ): Promise<discussions_pb.Discussion>;

  getDiscussion(
    request: discussions_pb.GetDiscussionReq,
    metadata?: grpcWeb.Metadata
  ): Promise<discussions_pb.Discussion>;

}

