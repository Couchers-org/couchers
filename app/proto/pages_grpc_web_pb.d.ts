import * as grpcWeb from 'grpc-web';

import * as pages_pb from './pages_pb'; // proto import: "pages.proto"


export class PagesClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  createPlace(
    request: pages_pb.CreatePlaceReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: pages_pb.Page) => void
  ): grpcWeb.ClientReadableStream<pages_pb.Page>;

  createGuide(
    request: pages_pb.CreateGuideReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: pages_pb.Page) => void
  ): grpcWeb.ClientReadableStream<pages_pb.Page>;

  getPage(
    request: pages_pb.GetPageReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: pages_pb.Page) => void
  ): grpcWeb.ClientReadableStream<pages_pb.Page>;

  updatePage(
    request: pages_pb.UpdatePageReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: pages_pb.Page) => void
  ): grpcWeb.ClientReadableStream<pages_pb.Page>;

  transferPage(
    request: pages_pb.TransferPageReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: pages_pb.Page) => void
  ): grpcWeb.ClientReadableStream<pages_pb.Page>;

  listUserPlaces(
    request: pages_pb.ListUserPlacesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: pages_pb.ListUserPlacesRes) => void
  ): grpcWeb.ClientReadableStream<pages_pb.ListUserPlacesRes>;

  listUserGuides(
    request: pages_pb.ListUserGuidesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: pages_pb.ListUserGuidesRes) => void
  ): grpcWeb.ClientReadableStream<pages_pb.ListUserGuidesRes>;

}

export class PagesPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  createPlace(
    request: pages_pb.CreatePlaceReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pages_pb.Page>;

  createGuide(
    request: pages_pb.CreateGuideReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pages_pb.Page>;

  getPage(
    request: pages_pb.GetPageReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pages_pb.Page>;

  updatePage(
    request: pages_pb.UpdatePageReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pages_pb.Page>;

  transferPage(
    request: pages_pb.TransferPageReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pages_pb.Page>;

  listUserPlaces(
    request: pages_pb.ListUserPlacesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pages_pb.ListUserPlacesRes>;

  listUserGuides(
    request: pages_pb.ListUserGuidesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pages_pb.ListUserGuidesRes>;

}

