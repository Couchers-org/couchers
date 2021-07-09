import * as grpcWeb from "grpc-web";

import * as pb_pages_pb from "../pb/pages_pb";

export class PagesClient {
  constructor(
    hostname: string,
    credentials?: null | { [index: string]: string },
    options?: null | { [index: string]: any }
  );

  createPlace(
    request: pb_pages_pb.CreatePlaceReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error, response: pb_pages_pb.Page) => void
  ): grpcWeb.ClientReadableStream<pb_pages_pb.Page>;

  createGuide(
    request: pb_pages_pb.CreateGuideReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error, response: pb_pages_pb.Page) => void
  ): grpcWeb.ClientReadableStream<pb_pages_pb.Page>;

  getPage(
    request: pb_pages_pb.GetPageReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error, response: pb_pages_pb.Page) => void
  ): grpcWeb.ClientReadableStream<pb_pages_pb.Page>;

  updatePage(
    request: pb_pages_pb.UpdatePageReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error, response: pb_pages_pb.Page) => void
  ): grpcWeb.ClientReadableStream<pb_pages_pb.Page>;

  transferPage(
    request: pb_pages_pb.TransferPageReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error, response: pb_pages_pb.Page) => void
  ): grpcWeb.ClientReadableStream<pb_pages_pb.Page>;

  listUserPlaces(
    request: pb_pages_pb.ListUserPlacesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: pb_pages_pb.ListUserPlacesRes
    ) => void
  ): grpcWeb.ClientReadableStream<pb_pages_pb.ListUserPlacesRes>;

  listUserGuides(
    request: pb_pages_pb.ListUserGuidesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: pb_pages_pb.ListUserGuidesRes
    ) => void
  ): grpcWeb.ClientReadableStream<pb_pages_pb.ListUserGuidesRes>;
}

export class PagesPromiseClient {
  constructor(
    hostname: string,
    credentials?: null | { [index: string]: string },
    options?: null | { [index: string]: any }
  );

  createPlace(
    request: pb_pages_pb.CreatePlaceReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_pages_pb.Page>;

  createGuide(
    request: pb_pages_pb.CreateGuideReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_pages_pb.Page>;

  getPage(
    request: pb_pages_pb.GetPageReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_pages_pb.Page>;

  updatePage(
    request: pb_pages_pb.UpdatePageReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_pages_pb.Page>;

  transferPage(
    request: pb_pages_pb.TransferPageReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_pages_pb.Page>;

  listUserPlaces(
    request: pb_pages_pb.ListUserPlacesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_pages_pb.ListUserPlacesRes>;

  listUserGuides(
    request: pb_pages_pb.ListUserGuidesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_pages_pb.ListUserGuidesRes>;
}
