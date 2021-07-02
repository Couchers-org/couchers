import * as grpcWeb from 'grpc-web';

import * as pb_search_pb from '../pb/search_pb';


export class SearchClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  search(
    request: pb_search_pb.SearchReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_search_pb.SearchRes) => void
  ): grpcWeb.ClientReadableStream<pb_search_pb.SearchRes>;

  userSearch(
    request: pb_search_pb.UserSearchReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_search_pb.UserSearchRes) => void
  ): grpcWeb.ClientReadableStream<pb_search_pb.UserSearchRes>;

}

export class SearchPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  search(
    request: pb_search_pb.SearchReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_search_pb.SearchRes>;

  userSearch(
    request: pb_search_pb.UserSearchReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_search_pb.UserSearchRes>;

}

