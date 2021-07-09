import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as grpcWeb from "grpc-web";

import * as pb_media_pb from "../pb/media_pb";

export class MediaClient {
  constructor(
    hostname: string,
    credentials?: null | { [index: string]: string },
    options?: null | { [index: string]: any }
  );

  uploadConfirmation(
    request: pb_media_pb.UploadConfirmationReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (
      err: grpcWeb.Error,
      response: google_protobuf_empty_pb.Empty
    ) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;
}

export class MediaPromiseClient {
  constructor(
    hostname: string,
    credentials?: null | { [index: string]: string },
    options?: null | { [index: string]: any }
  );

  uploadConfirmation(
    request: pb_media_pb.UploadConfirmationReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;
}
