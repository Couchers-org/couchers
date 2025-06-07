import * as jspb from 'google-protobuf'

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as annotations_pb from './annotations_pb'; // proto import: "annotations.proto"
import * as account_pb from './account_pb'; // proto import: "account.proto"


export class JailInfoRes extends jspb.Message {
  getJailed(): boolean;
  setJailed(value: boolean): JailInfoRes;

  getHasNotAcceptedTos(): boolean;
  setHasNotAcceptedTos(value: boolean): JailInfoRes;

  getNeedsToUpdateLocation(): boolean;
  setNeedsToUpdateLocation(value: boolean): JailInfoRes;

  getHasNotAcceptedCommunityGuidelines(): boolean;
  setHasNotAcceptedCommunityGuidelines(value: boolean): JailInfoRes;

  getHasPendingModNotes(): boolean;
  setHasPendingModNotes(value: boolean): JailInfoRes;

  getPendingModNotesList(): Array<account_pb.ModNote>;
  setPendingModNotesList(value: Array<account_pb.ModNote>): JailInfoRes;
  clearPendingModNotesList(): JailInfoRes;
  addPendingModNotes(value?: account_pb.ModNote, index?: number): account_pb.ModNote;

  getHasPendingActivenessProbe(): boolean;
  setHasPendingActivenessProbe(value: boolean): JailInfoRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): JailInfoRes.AsObject;
  static toObject(includeInstance: boolean, msg: JailInfoRes): JailInfoRes.AsObject;
  static serializeBinaryToWriter(message: JailInfoRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): JailInfoRes;
  static deserializeBinaryFromReader(message: JailInfoRes, reader: jspb.BinaryReader): JailInfoRes;
}

export namespace JailInfoRes {
  export type AsObject = {
    jailed: boolean,
    hasNotAcceptedTos: boolean,
    needsToUpdateLocation: boolean,
    hasNotAcceptedCommunityGuidelines: boolean,
    hasPendingModNotes: boolean,
    pendingModNotesList: Array<account_pb.ModNote.AsObject>,
    hasPendingActivenessProbe: boolean,
  }
}

export class AcceptTOSReq extends jspb.Message {
  getAccept(): boolean;
  setAccept(value: boolean): AcceptTOSReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AcceptTOSReq.AsObject;
  static toObject(includeInstance: boolean, msg: AcceptTOSReq): AcceptTOSReq.AsObject;
  static serializeBinaryToWriter(message: AcceptTOSReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AcceptTOSReq;
  static deserializeBinaryFromReader(message: AcceptTOSReq, reader: jspb.BinaryReader): AcceptTOSReq;
}

export namespace AcceptTOSReq {
  export type AsObject = {
    accept: boolean,
  }
}

export class SetLocationReq extends jspb.Message {
  getCity(): string;
  setCity(value: string): SetLocationReq;

  getLat(): number;
  setLat(value: number): SetLocationReq;

  getLng(): number;
  setLng(value: number): SetLocationReq;

  getRadius(): number;
  setRadius(value: number): SetLocationReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SetLocationReq.AsObject;
  static toObject(includeInstance: boolean, msg: SetLocationReq): SetLocationReq.AsObject;
  static serializeBinaryToWriter(message: SetLocationReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SetLocationReq;
  static deserializeBinaryFromReader(message: SetLocationReq, reader: jspb.BinaryReader): SetLocationReq;
}

export namespace SetLocationReq {
  export type AsObject = {
    city: string,
    lat: number,
    lng: number,
    radius: number,
  }
}

export class AcceptCommunityGuidelinesReq extends jspb.Message {
  getAccept(): boolean;
  setAccept(value: boolean): AcceptCommunityGuidelinesReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AcceptCommunityGuidelinesReq.AsObject;
  static toObject(includeInstance: boolean, msg: AcceptCommunityGuidelinesReq): AcceptCommunityGuidelinesReq.AsObject;
  static serializeBinaryToWriter(message: AcceptCommunityGuidelinesReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AcceptCommunityGuidelinesReq;
  static deserializeBinaryFromReader(message: AcceptCommunityGuidelinesReq, reader: jspb.BinaryReader): AcceptCommunityGuidelinesReq;
}

export namespace AcceptCommunityGuidelinesReq {
  export type AsObject = {
    accept: boolean,
  }
}

export class AcknowledgePendingModNoteReq extends jspb.Message {
  getNoteId(): number;
  setNoteId(value: number): AcknowledgePendingModNoteReq;

  getAcknowledge(): boolean;
  setAcknowledge(value: boolean): AcknowledgePendingModNoteReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AcknowledgePendingModNoteReq.AsObject;
  static toObject(includeInstance: boolean, msg: AcknowledgePendingModNoteReq): AcknowledgePendingModNoteReq.AsObject;
  static serializeBinaryToWriter(message: AcknowledgePendingModNoteReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AcknowledgePendingModNoteReq;
  static deserializeBinaryFromReader(message: AcknowledgePendingModNoteReq, reader: jspb.BinaryReader): AcknowledgePendingModNoteReq;
}

export namespace AcknowledgePendingModNoteReq {
  export type AsObject = {
    noteId: number,
    acknowledge: boolean,
  }
}

export class RespondToActivenessProbeReq extends jspb.Message {
  getResponse(): ActivenessProbeResponse;
  setResponse(value: ActivenessProbeResponse): RespondToActivenessProbeReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RespondToActivenessProbeReq.AsObject;
  static toObject(includeInstance: boolean, msg: RespondToActivenessProbeReq): RespondToActivenessProbeReq.AsObject;
  static serializeBinaryToWriter(message: RespondToActivenessProbeReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RespondToActivenessProbeReq;
  static deserializeBinaryFromReader(message: RespondToActivenessProbeReq, reader: jspb.BinaryReader): RespondToActivenessProbeReq;
}

export namespace RespondToActivenessProbeReq {
  export type AsObject = {
    response: ActivenessProbeResponse,
  }
}

export enum ActivenessProbeResponse { 
  ACTIVENESS_PROBE_RESPONSE_UNKNOWN = 0,
  ACTIVENESS_PROBE_RESPONSE_STILL_ACTIVE = 1,
  ACTIVENESS_PROBE_RESPONSE_NO_LONGER_ACTIVE = 2,
}
