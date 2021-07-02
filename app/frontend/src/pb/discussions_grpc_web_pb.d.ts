import * as grpcWeb from 'grpc-web';

import * as pb_discussions_pb from '../pb/discussions_pb';


export class DiscussionsClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  createDiscussion(
    request: pb_discussions_pb.CreateDiscussionReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_discussions_pb.Discussion) => void
  ): grpcWeb.ClientReadableStream<pb_discussions_pb.Discussion>;

  getDiscussion(
    request: pb_discussions_pb.GetDiscussionReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_discussions_pb.Discussion) => void
  ): grpcWeb.ClientReadableStream<pb_discussions_pb.Discussion>;

}

export class DiscussionsPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  createDiscussion(
    request: pb_discussions_pb.CreateDiscussionReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_discussions_pb.Discussion>;

  getDiscussion(
    request: pb_discussions_pb.GetDiscussionReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_discussions_pb.Discussion>;

}

