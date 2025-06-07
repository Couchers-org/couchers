import * as grpcWeb from 'grpc-web';

import * as search_pb from './search_pb'; // proto import: "search.proto"


export class SearchClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  search(
    request: search_pb.SearchReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: search_pb.SearchRes) => void
  ): grpcWeb.ClientReadableStream<search_pb.SearchRes>;

  userSearch(
    request: search_pb.UserSearchReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: search_pb.UserSearchRes) => void
  ): grpcWeb.ClientReadableStream<search_pb.UserSearchRes>;

  eventSearch(
    request: search_pb.EventSearchReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: search_pb.EventSearchRes) => void
  ): grpcWeb.ClientReadableStream<search_pb.EventSearchRes>;

}

export class SearchPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  search(
    request: search_pb.SearchReq,
    metadata?: grpcWeb.Metadata
  ): Promise<search_pb.SearchRes>;

  userSearch(
    request: search_pb.UserSearchReq,
    metadata?: grpcWeb.Metadata
  ): Promise<search_pb.UserSearchRes>;

  eventSearch(
    request: search_pb.EventSearchReq,
    metadata?: grpcWeb.Metadata
  ): Promise<search_pb.EventSearchRes>;

}

