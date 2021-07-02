import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';
import * as grpcWeb from 'grpc-web';

import * as pb_references_pb from '../pb/references_pb';


export class ReferencesClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  listReferences(
    request: pb_references_pb.ListReferencesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_references_pb.ListReferencesRes) => void
  ): grpcWeb.ClientReadableStream<pb_references_pb.ListReferencesRes>;

  writeFriendReference(
    request: pb_references_pb.WriteFriendReferenceReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_references_pb.Reference) => void
  ): grpcWeb.ClientReadableStream<pb_references_pb.Reference>;

  writeHostRequestReference(
    request: pb_references_pb.WriteHostRequestReferenceReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_references_pb.Reference) => void
  ): grpcWeb.ClientReadableStream<pb_references_pb.Reference>;

  availableWriteReferences(
    request: pb_references_pb.AvailableWriteReferencesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_references_pb.AvailableWriteReferencesRes) => void
  ): grpcWeb.ClientReadableStream<pb_references_pb.AvailableWriteReferencesRes>;

  listPendingReferencesToWrite(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_references_pb.ListPendingReferencesToWriteRes) => void
  ): grpcWeb.ClientReadableStream<pb_references_pb.ListPendingReferencesToWriteRes>;

}

export class ReferencesPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  listReferences(
    request: pb_references_pb.ListReferencesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_references_pb.ListReferencesRes>;

  writeFriendReference(
    request: pb_references_pb.WriteFriendReferenceReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_references_pb.Reference>;

  writeHostRequestReference(
    request: pb_references_pb.WriteHostRequestReferenceReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_references_pb.Reference>;

  availableWriteReferences(
    request: pb_references_pb.AvailableWriteReferencesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_references_pb.AvailableWriteReferencesRes>;

  listPendingReferencesToWrite(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_references_pb.ListPendingReferencesToWriteRes>;

}

