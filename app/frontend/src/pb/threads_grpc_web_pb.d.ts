import * as grpcWeb from 'grpc-web';

import * as pb_threads_pb from '../pb/threads_pb';


export class ThreadsClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  getThread(
    request: pb_threads_pb.GetThreadReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_threads_pb.GetThreadRes) => void
  ): grpcWeb.ClientReadableStream<pb_threads_pb.GetThreadRes>;

  postReply(
    request: pb_threads_pb.PostReplyReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_threads_pb.PostReplyRes) => void
  ): grpcWeb.ClientReadableStream<pb_threads_pb.PostReplyRes>;

}

export class ThreadsPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  getThread(
    request: pb_threads_pb.GetThreadReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_threads_pb.GetThreadRes>;

  postReply(
    request: pb_threads_pb.PostReplyReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_threads_pb.PostReplyRes>;

}

