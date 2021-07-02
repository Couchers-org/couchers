import * as jspb from 'google-protobuf'

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';
import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';


export class Reference extends jspb.Message {
  getReferenceId(): number;
  setReferenceId(value: number): Reference;

  getFromUserId(): number;
  setFromUserId(value: number): Reference;

  getToUserId(): number;
  setToUserId(value: number): Reference;

  getReferenceType(): ReferenceType;
  setReferenceType(value: ReferenceType): Reference;

  getText(): string;
  setText(value: string): Reference;

  getWrittenTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setWrittenTime(value?: google_protobuf_timestamp_pb.Timestamp): Reference;
  hasWrittenTime(): boolean;
  clearWrittenTime(): Reference;

  getHostRequestId(): number;
  setHostRequestId(value: number): Reference;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Reference.AsObject;
  static toObject(includeInstance: boolean, msg: Reference): Reference.AsObject;
  static serializeBinaryToWriter(message: Reference, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Reference;
  static deserializeBinaryFromReader(message: Reference, reader: jspb.BinaryReader): Reference;
}

export namespace Reference {
  export type AsObject = {
    referenceId: number,
    fromUserId: number,
    toUserId: number,
    referenceType: ReferenceType,
    text: string,
    writtenTime?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    hostRequestId: number,
  }
}

export class ListReferencesReq extends jspb.Message {
  getFromUserId(): number;
  setFromUserId(value: number): ListReferencesReq;

  getToUserId(): number;
  setToUserId(value: number): ListReferencesReq;

  getReferenceTypeFilterList(): Array<ReferenceType>;
  setReferenceTypeFilterList(value: Array<ReferenceType>): ListReferencesReq;
  clearReferenceTypeFilterList(): ListReferencesReq;
  addReferenceTypeFilter(value: ReferenceType, index?: number): ListReferencesReq;

  getPageSize(): number;
  setPageSize(value: number): ListReferencesReq;

  getPageToken(): string;
  setPageToken(value: string): ListReferencesReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListReferencesReq.AsObject;
  static toObject(includeInstance: boolean, msg: ListReferencesReq): ListReferencesReq.AsObject;
  static serializeBinaryToWriter(message: ListReferencesReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListReferencesReq;
  static deserializeBinaryFromReader(message: ListReferencesReq, reader: jspb.BinaryReader): ListReferencesReq;
}

export namespace ListReferencesReq {
  export type AsObject = {
    fromUserId: number,
    toUserId: number,
    referenceTypeFilterList: Array<ReferenceType>,
    pageSize: number,
    pageToken: string,
  }
}

export class ListReferencesRes extends jspb.Message {
  getReferencesList(): Array<Reference>;
  setReferencesList(value: Array<Reference>): ListReferencesRes;
  clearReferencesList(): ListReferencesRes;
  addReferences(value?: Reference, index?: number): Reference;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListReferencesRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListReferencesRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListReferencesRes): ListReferencesRes.AsObject;
  static serializeBinaryToWriter(message: ListReferencesRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListReferencesRes;
  static deserializeBinaryFromReader(message: ListReferencesRes, reader: jspb.BinaryReader): ListReferencesRes;
}

export namespace ListReferencesRes {
  export type AsObject = {
    referencesList: Array<Reference.AsObject>,
    nextPageToken: string,
  }
}

export class WriteFriendReferenceReq extends jspb.Message {
  getToUserId(): number;
  setToUserId(value: number): WriteFriendReferenceReq;

  getText(): string;
  setText(value: string): WriteFriendReferenceReq;

  getWasAppropriate(): boolean;
  setWasAppropriate(value: boolean): WriteFriendReferenceReq;

  getRating(): number;
  setRating(value: number): WriteFriendReferenceReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WriteFriendReferenceReq.AsObject;
  static toObject(includeInstance: boolean, msg: WriteFriendReferenceReq): WriteFriendReferenceReq.AsObject;
  static serializeBinaryToWriter(message: WriteFriendReferenceReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): WriteFriendReferenceReq;
  static deserializeBinaryFromReader(message: WriteFriendReferenceReq, reader: jspb.BinaryReader): WriteFriendReferenceReq;
}

export namespace WriteFriendReferenceReq {
  export type AsObject = {
    toUserId: number,
    text: string,
    wasAppropriate: boolean,
    rating: number,
  }
}

export class WriteHostRequestReferenceReq extends jspb.Message {
  getHostRequestId(): number;
  setHostRequestId(value: number): WriteHostRequestReferenceReq;

  getText(): string;
  setText(value: string): WriteHostRequestReferenceReq;

  getWasAppropriate(): boolean;
  setWasAppropriate(value: boolean): WriteHostRequestReferenceReq;

  getRating(): number;
  setRating(value: number): WriteHostRequestReferenceReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WriteHostRequestReferenceReq.AsObject;
  static toObject(includeInstance: boolean, msg: WriteHostRequestReferenceReq): WriteHostRequestReferenceReq.AsObject;
  static serializeBinaryToWriter(message: WriteHostRequestReferenceReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): WriteHostRequestReferenceReq;
  static deserializeBinaryFromReader(message: WriteHostRequestReferenceReq, reader: jspb.BinaryReader): WriteHostRequestReferenceReq;
}

export namespace WriteHostRequestReferenceReq {
  export type AsObject = {
    hostRequestId: number,
    text: string,
    wasAppropriate: boolean,
    rating: number,
  }
}

export class AvailableWriteReferencesReq extends jspb.Message {
  getToUserId(): number;
  setToUserId(value: number): AvailableWriteReferencesReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AvailableWriteReferencesReq.AsObject;
  static toObject(includeInstance: boolean, msg: AvailableWriteReferencesReq): AvailableWriteReferencesReq.AsObject;
  static serializeBinaryToWriter(message: AvailableWriteReferencesReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AvailableWriteReferencesReq;
  static deserializeBinaryFromReader(message: AvailableWriteReferencesReq, reader: jspb.BinaryReader): AvailableWriteReferencesReq;
}

export namespace AvailableWriteReferencesReq {
  export type AsObject = {
    toUserId: number,
  }
}

export class AvailableWriteReferenceType extends jspb.Message {
  getHostRequestId(): number;
  setHostRequestId(value: number): AvailableWriteReferenceType;

  getReferenceType(): ReferenceType;
  setReferenceType(value: ReferenceType): AvailableWriteReferenceType;

  getTimeExpires(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setTimeExpires(value?: google_protobuf_timestamp_pb.Timestamp): AvailableWriteReferenceType;
  hasTimeExpires(): boolean;
  clearTimeExpires(): AvailableWriteReferenceType;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AvailableWriteReferenceType.AsObject;
  static toObject(includeInstance: boolean, msg: AvailableWriteReferenceType): AvailableWriteReferenceType.AsObject;
  static serializeBinaryToWriter(message: AvailableWriteReferenceType, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AvailableWriteReferenceType;
  static deserializeBinaryFromReader(message: AvailableWriteReferenceType, reader: jspb.BinaryReader): AvailableWriteReferenceType;
}

export namespace AvailableWriteReferenceType {
  export type AsObject = {
    hostRequestId: number,
    referenceType: ReferenceType,
    timeExpires?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class AvailableWriteReferencesRes extends jspb.Message {
  getCanWriteFriendReference(): boolean;
  setCanWriteFriendReference(value: boolean): AvailableWriteReferencesRes;

  getAvailableWriteReferencesList(): Array<AvailableWriteReferenceType>;
  setAvailableWriteReferencesList(value: Array<AvailableWriteReferenceType>): AvailableWriteReferencesRes;
  clearAvailableWriteReferencesList(): AvailableWriteReferencesRes;
  addAvailableWriteReferences(value?: AvailableWriteReferenceType, index?: number): AvailableWriteReferenceType;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AvailableWriteReferencesRes.AsObject;
  static toObject(includeInstance: boolean, msg: AvailableWriteReferencesRes): AvailableWriteReferencesRes.AsObject;
  static serializeBinaryToWriter(message: AvailableWriteReferencesRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AvailableWriteReferencesRes;
  static deserializeBinaryFromReader(message: AvailableWriteReferencesRes, reader: jspb.BinaryReader): AvailableWriteReferencesRes;
}

export namespace AvailableWriteReferencesRes {
  export type AsObject = {
    canWriteFriendReference: boolean,
    availableWriteReferencesList: Array<AvailableWriteReferenceType.AsObject>,
  }
}

export class ListPendingReferencesToWriteRes extends jspb.Message {
  getPendingReferencesList(): Array<AvailableWriteReferenceType>;
  setPendingReferencesList(value: Array<AvailableWriteReferenceType>): ListPendingReferencesToWriteRes;
  clearPendingReferencesList(): ListPendingReferencesToWriteRes;
  addPendingReferences(value?: AvailableWriteReferenceType, index?: number): AvailableWriteReferenceType;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListPendingReferencesToWriteRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListPendingReferencesToWriteRes): ListPendingReferencesToWriteRes.AsObject;
  static serializeBinaryToWriter(message: ListPendingReferencesToWriteRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListPendingReferencesToWriteRes;
  static deserializeBinaryFromReader(message: ListPendingReferencesToWriteRes, reader: jspb.BinaryReader): ListPendingReferencesToWriteRes;
}

export namespace ListPendingReferencesToWriteRes {
  export type AsObject = {
    pendingReferencesList: Array<AvailableWriteReferenceType.AsObject>,
  }
}

export enum ReferenceType { 
  REFERENCE_TYPE_FRIEND = 0,
  REFERENCE_TYPE_SURFED = 1,
  REFERENCE_TYPE_HOSTED = 2,
}
