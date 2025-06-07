import * as grpcWeb from 'grpc-web';

import * as threads_pb from './threads_pb'; // proto import: "threads.proto"


export class ThreadsClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  getThread(
    request: threads_pb.GetThreadReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: threads_pb.GetThreadRes) => void
  ): grpcWeb.ClientReadableStream<threads_pb.GetThreadRes>;

  postReply(
    request: threads_pb.PostReplyReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: threads_pb.PostReplyRes) => void
  ): grpcWeb.ClientReadableStream<threads_pb.PostReplyRes>;

}

export class ThreadsPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  getThread(
    request: threads_pb.GetThreadReq,
    metadata?: grpcWeb.Metadata
  ): Promise<threads_pb.GetThreadRes>;

  postReply(
    request: threads_pb.PostReplyReq,
    metadata?: grpcWeb.Metadata
  ): Promise<threads_pb.PostReplyRes>;

}

