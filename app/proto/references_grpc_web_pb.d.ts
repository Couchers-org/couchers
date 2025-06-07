import * as grpcWeb from 'grpc-web';

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as references_pb from './references_pb'; // proto import: "references.proto"


export class ReferencesClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  listReferences(
    request: references_pb.ListReferencesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: references_pb.ListReferencesRes) => void
  ): grpcWeb.ClientReadableStream<references_pb.ListReferencesRes>;

  writeFriendReference(
    request: references_pb.WriteFriendReferenceReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: references_pb.Reference) => void
  ): grpcWeb.ClientReadableStream<references_pb.Reference>;

  writeHostRequestReference(
    request: references_pb.WriteHostRequestReferenceReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: references_pb.Reference) => void
  ): grpcWeb.ClientReadableStream<references_pb.Reference>;

  hostRequestIndicateDidntMeetup(
    request: references_pb.HostRequestIndicateDidntMeetupReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  availableWriteReferences(
    request: references_pb.AvailableWriteReferencesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: references_pb.AvailableWriteReferencesRes) => void
  ): grpcWeb.ClientReadableStream<references_pb.AvailableWriteReferencesRes>;

  listPendingReferencesToWrite(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: references_pb.ListPendingReferencesToWriteRes) => void
  ): grpcWeb.ClientReadableStream<references_pb.ListPendingReferencesToWriteRes>;

}

export class ReferencesPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  listReferences(
    request: references_pb.ListReferencesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<references_pb.ListReferencesRes>;

  writeFriendReference(
    request: references_pb.WriteFriendReferenceReq,
    metadata?: grpcWeb.Metadata
  ): Promise<references_pb.Reference>;

  writeHostRequestReference(
    request: references_pb.WriteHostRequestReferenceReq,
    metadata?: grpcWeb.Metadata
  ): Promise<references_pb.Reference>;

  hostRequestIndicateDidntMeetup(
    request: references_pb.HostRequestIndicateDidntMeetupReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  availableWriteReferences(
    request: references_pb.AvailableWriteReferencesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<references_pb.AvailableWriteReferencesRes>;

  listPendingReferencesToWrite(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<references_pb.ListPendingReferencesToWriteRes>;

}

