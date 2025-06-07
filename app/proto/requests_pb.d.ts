import * as jspb from 'google-protobuf'

import * as google_protobuf_duration_pb from 'google-protobuf/google/protobuf/duration_pb'; // proto import: "google/protobuf/duration.proto"
import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb'; // proto import: "google/protobuf/timestamp.proto"
import * as annotations_pb from './annotations_pb'; // proto import: "annotations.proto"
import * as conversations_pb from './conversations_pb'; // proto import: "conversations.proto"


export class CreateHostRequestReq extends jspb.Message {
  getHostUserId(): number;
  setHostUserId(value: number): CreateHostRequestReq;

  getFromDate(): string;
  setFromDate(value: string): CreateHostRequestReq;

  getToDate(): string;
  setToDate(value: string): CreateHostRequestReq;

  getText(): string;
  setText(value: string): CreateHostRequestReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateHostRequestReq.AsObject;
  static toObject(includeInstance: boolean, msg: CreateHostRequestReq): CreateHostRequestReq.AsObject;
  static serializeBinaryToWriter(message: CreateHostRequestReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateHostRequestReq;
  static deserializeBinaryFromReader(message: CreateHostRequestReq, reader: jspb.BinaryReader): CreateHostRequestReq;
}

export namespace CreateHostRequestReq {
  export type AsObject = {
    hostUserId: number,
    fromDate: string,
    toDate: string,
    text: string,
  }
}

export class HostRequest extends jspb.Message {
  getHostRequestId(): number;
  setHostRequestId(value: number): HostRequest;

  getSurferUserId(): number;
  setSurferUserId(value: number): HostRequest;

  getHostUserId(): number;
  setHostUserId(value: number): HostRequest;

  getStatus(): conversations_pb.HostRequestStatus;
  setStatus(value: conversations_pb.HostRequestStatus): HostRequest;

  getCreated(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setCreated(value?: google_protobuf_timestamp_pb.Timestamp): HostRequest;
  hasCreated(): boolean;
  clearCreated(): HostRequest;

  getFromDate(): string;
  setFromDate(value: string): HostRequest;

  getToDate(): string;
  setToDate(value: string): HostRequest;

  getLastSeenMessageId(): number;
  setLastSeenMessageId(value: number): HostRequest;

  getLatestMessage(): conversations_pb.Message | undefined;
  setLatestMessage(value?: conversations_pb.Message): HostRequest;
  hasLatestMessage(): boolean;
  clearLatestMessage(): HostRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HostRequest.AsObject;
  static toObject(includeInstance: boolean, msg: HostRequest): HostRequest.AsObject;
  static serializeBinaryToWriter(message: HostRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HostRequest;
  static deserializeBinaryFromReader(message: HostRequest, reader: jspb.BinaryReader): HostRequest;
}

export namespace HostRequest {
  export type AsObject = {
    hostRequestId: number,
    surferUserId: number,
    hostUserId: number,
    status: conversations_pb.HostRequestStatus,
    created?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    fromDate: string,
    toDate: string,
    lastSeenMessageId: number,
    latestMessage?: conversations_pb.Message.AsObject,
  }
}

export class GetHostRequestReq extends jspb.Message {
  getHostRequestId(): number;
  setHostRequestId(value: number): GetHostRequestReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetHostRequestReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetHostRequestReq): GetHostRequestReq.AsObject;
  static serializeBinaryToWriter(message: GetHostRequestReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetHostRequestReq;
  static deserializeBinaryFromReader(message: GetHostRequestReq, reader: jspb.BinaryReader): GetHostRequestReq;
}

export namespace GetHostRequestReq {
  export type AsObject = {
    hostRequestId: number,
  }
}

export class CreateHostRequestRes extends jspb.Message {
  getHostRequestId(): number;
  setHostRequestId(value: number): CreateHostRequestRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateHostRequestRes.AsObject;
  static toObject(includeInstance: boolean, msg: CreateHostRequestRes): CreateHostRequestRes.AsObject;
  static serializeBinaryToWriter(message: CreateHostRequestRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateHostRequestRes;
  static deserializeBinaryFromReader(message: CreateHostRequestRes, reader: jspb.BinaryReader): CreateHostRequestRes;
}

export namespace CreateHostRequestRes {
  export type AsObject = {
    hostRequestId: number,
  }
}

export class RespondHostRequestReq extends jspb.Message {
  getHostRequestId(): number;
  setHostRequestId(value: number): RespondHostRequestReq;

  getStatus(): conversations_pb.HostRequestStatus;
  setStatus(value: conversations_pb.HostRequestStatus): RespondHostRequestReq;

  getText(): string;
  setText(value: string): RespondHostRequestReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RespondHostRequestReq.AsObject;
  static toObject(includeInstance: boolean, msg: RespondHostRequestReq): RespondHostRequestReq.AsObject;
  static serializeBinaryToWriter(message: RespondHostRequestReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RespondHostRequestReq;
  static deserializeBinaryFromReader(message: RespondHostRequestReq, reader: jspb.BinaryReader): RespondHostRequestReq;
}

export namespace RespondHostRequestReq {
  export type AsObject = {
    hostRequestId: number,
    status: conversations_pb.HostRequestStatus,
    text: string,
  }
}

export class ListHostRequestsReq extends jspb.Message {
  getLastRequestId(): number;
  setLastRequestId(value: number): ListHostRequestsReq;

  getNumber(): number;
  setNumber(value: number): ListHostRequestsReq;

  getOnlyActive(): boolean;
  setOnlyActive(value: boolean): ListHostRequestsReq;

  getOnlySent(): boolean;
  setOnlySent(value: boolean): ListHostRequestsReq;

  getOnlyReceived(): boolean;
  setOnlyReceived(value: boolean): ListHostRequestsReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListHostRequestsReq.AsObject;
  static toObject(includeInstance: boolean, msg: ListHostRequestsReq): ListHostRequestsReq.AsObject;
  static serializeBinaryToWriter(message: ListHostRequestsReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListHostRequestsReq;
  static deserializeBinaryFromReader(message: ListHostRequestsReq, reader: jspb.BinaryReader): ListHostRequestsReq;
}

export namespace ListHostRequestsReq {
  export type AsObject = {
    lastRequestId: number,
    number: number,
    onlyActive: boolean,
    onlySent: boolean,
    onlyReceived: boolean,
  }
}

export class ListHostRequestsRes extends jspb.Message {
  getHostRequestsList(): Array<HostRequest>;
  setHostRequestsList(value: Array<HostRequest>): ListHostRequestsRes;
  clearHostRequestsList(): ListHostRequestsRes;
  addHostRequests(value?: HostRequest, index?: number): HostRequest;

  getLastRequestId(): number;
  setLastRequestId(value: number): ListHostRequestsRes;

  getNoMore(): boolean;
  setNoMore(value: boolean): ListHostRequestsRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListHostRequestsRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListHostRequestsRes): ListHostRequestsRes.AsObject;
  static serializeBinaryToWriter(message: ListHostRequestsRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListHostRequestsRes;
  static deserializeBinaryFromReader(message: ListHostRequestsRes, reader: jspb.BinaryReader): ListHostRequestsRes;
}

export namespace ListHostRequestsRes {
  export type AsObject = {
    hostRequestsList: Array<HostRequest.AsObject>,
    lastRequestId: number,
    noMore: boolean,
  }
}

export class GetHostRequestMessagesReq extends jspb.Message {
  getHostRequestId(): number;
  setHostRequestId(value: number): GetHostRequestMessagesReq;

  getLastMessageId(): number;
  setLastMessageId(value: number): GetHostRequestMessagesReq;

  getNumber(): number;
  setNumber(value: number): GetHostRequestMessagesReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetHostRequestMessagesReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetHostRequestMessagesReq): GetHostRequestMessagesReq.AsObject;
  static serializeBinaryToWriter(message: GetHostRequestMessagesReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetHostRequestMessagesReq;
  static deserializeBinaryFromReader(message: GetHostRequestMessagesReq, reader: jspb.BinaryReader): GetHostRequestMessagesReq;
}

export namespace GetHostRequestMessagesReq {
  export type AsObject = {
    hostRequestId: number,
    lastMessageId: number,
    number: number,
  }
}

export class GetHostRequestMessagesRes extends jspb.Message {
  getMessagesList(): Array<conversations_pb.Message>;
  setMessagesList(value: Array<conversations_pb.Message>): GetHostRequestMessagesRes;
  clearMessagesList(): GetHostRequestMessagesRes;
  addMessages(value?: conversations_pb.Message, index?: number): conversations_pb.Message;

  getLastMessageId(): number;
  setLastMessageId(value: number): GetHostRequestMessagesRes;

  getNoMore(): boolean;
  setNoMore(value: boolean): GetHostRequestMessagesRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetHostRequestMessagesRes.AsObject;
  static toObject(includeInstance: boolean, msg: GetHostRequestMessagesRes): GetHostRequestMessagesRes.AsObject;
  static serializeBinaryToWriter(message: GetHostRequestMessagesRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetHostRequestMessagesRes;
  static deserializeBinaryFromReader(message: GetHostRequestMessagesRes, reader: jspb.BinaryReader): GetHostRequestMessagesRes;
}

export namespace GetHostRequestMessagesRes {
  export type AsObject = {
    messagesList: Array<conversations_pb.Message.AsObject>,
    lastMessageId: number,
    noMore: boolean,
  }
}

export class SendHostRequestMessageReq extends jspb.Message {
  getHostRequestId(): number;
  setHostRequestId(value: number): SendHostRequestMessageReq;

  getText(): string;
  setText(value: string): SendHostRequestMessageReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SendHostRequestMessageReq.AsObject;
  static toObject(includeInstance: boolean, msg: SendHostRequestMessageReq): SendHostRequestMessageReq.AsObject;
  static serializeBinaryToWriter(message: SendHostRequestMessageReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SendHostRequestMessageReq;
  static deserializeBinaryFromReader(message: SendHostRequestMessageReq, reader: jspb.BinaryReader): SendHostRequestMessageReq;
}

export namespace SendHostRequestMessageReq {
  export type AsObject = {
    hostRequestId: number,
    text: string,
  }
}

export class GetHostRequestUpdatesReq extends jspb.Message {
  getNewestMessageId(): number;
  setNewestMessageId(value: number): GetHostRequestUpdatesReq;

  getNumber(): number;
  setNumber(value: number): GetHostRequestUpdatesReq;

  getOnlySent(): boolean;
  setOnlySent(value: boolean): GetHostRequestUpdatesReq;

  getOnlyReceived(): boolean;
  setOnlyReceived(value: boolean): GetHostRequestUpdatesReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetHostRequestUpdatesReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetHostRequestUpdatesReq): GetHostRequestUpdatesReq.AsObject;
  static serializeBinaryToWriter(message: GetHostRequestUpdatesReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetHostRequestUpdatesReq;
  static deserializeBinaryFromReader(message: GetHostRequestUpdatesReq, reader: jspb.BinaryReader): GetHostRequestUpdatesReq;
}

export namespace GetHostRequestUpdatesReq {
  export type AsObject = {
    newestMessageId: number,
    number: number,
    onlySent: boolean,
    onlyReceived: boolean,
  }
}

export class HostRequestUpdate extends jspb.Message {
  getHostRequestId(): number;
  setHostRequestId(value: number): HostRequestUpdate;

  getMessage(): conversations_pb.Message | undefined;
  setMessage(value?: conversations_pb.Message): HostRequestUpdate;
  hasMessage(): boolean;
  clearMessage(): HostRequestUpdate;

  getStatus(): conversations_pb.HostRequestStatus;
  setStatus(value: conversations_pb.HostRequestStatus): HostRequestUpdate;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HostRequestUpdate.AsObject;
  static toObject(includeInstance: boolean, msg: HostRequestUpdate): HostRequestUpdate.AsObject;
  static serializeBinaryToWriter(message: HostRequestUpdate, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HostRequestUpdate;
  static deserializeBinaryFromReader(message: HostRequestUpdate, reader: jspb.BinaryReader): HostRequestUpdate;
}

export namespace HostRequestUpdate {
  export type AsObject = {
    hostRequestId: number,
    message?: conversations_pb.Message.AsObject,
    status: conversations_pb.HostRequestStatus,
  }
}

export class GetHostRequestUpdatesRes extends jspb.Message {
  getUpdatesList(): Array<HostRequestUpdate>;
  setUpdatesList(value: Array<HostRequestUpdate>): GetHostRequestUpdatesRes;
  clearUpdatesList(): GetHostRequestUpdatesRes;
  addUpdates(value?: HostRequestUpdate, index?: number): HostRequestUpdate;

  getNoMore(): boolean;
  setNoMore(value: boolean): GetHostRequestUpdatesRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetHostRequestUpdatesRes.AsObject;
  static toObject(includeInstance: boolean, msg: GetHostRequestUpdatesRes): GetHostRequestUpdatesRes.AsObject;
  static serializeBinaryToWriter(message: GetHostRequestUpdatesRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetHostRequestUpdatesRes;
  static deserializeBinaryFromReader(message: GetHostRequestUpdatesRes, reader: jspb.BinaryReader): GetHostRequestUpdatesRes;
}

export namespace GetHostRequestUpdatesRes {
  export type AsObject = {
    updatesList: Array<HostRequestUpdate.AsObject>,
    noMore: boolean,
  }
}

export class MarkLastSeenHostRequestReq extends jspb.Message {
  getHostRequestId(): number;
  setHostRequestId(value: number): MarkLastSeenHostRequestReq;

  getLastSeenMessageId(): number;
  setLastSeenMessageId(value: number): MarkLastSeenHostRequestReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MarkLastSeenHostRequestReq.AsObject;
  static toObject(includeInstance: boolean, msg: MarkLastSeenHostRequestReq): MarkLastSeenHostRequestReq.AsObject;
  static serializeBinaryToWriter(message: MarkLastSeenHostRequestReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MarkLastSeenHostRequestReq;
  static deserializeBinaryFromReader(message: MarkLastSeenHostRequestReq, reader: jspb.BinaryReader): MarkLastSeenHostRequestReq;
}

export namespace MarkLastSeenHostRequestReq {
  export type AsObject = {
    hostRequestId: number,
    lastSeenMessageId: number,
  }
}

export class GetResponseRateReq extends jspb.Message {
  getUserId(): number;
  setUserId(value: number): GetResponseRateReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetResponseRateReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetResponseRateReq): GetResponseRateReq.AsObject;
  static serializeBinaryToWriter(message: GetResponseRateReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetResponseRateReq;
  static deserializeBinaryFromReader(message: GetResponseRateReq, reader: jspb.BinaryReader): GetResponseRateReq;
}

export namespace GetResponseRateReq {
  export type AsObject = {
    userId: number,
  }
}

export class ResponseRateInsufficientData extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ResponseRateInsufficientData.AsObject;
  static toObject(includeInstance: boolean, msg: ResponseRateInsufficientData): ResponseRateInsufficientData.AsObject;
  static serializeBinaryToWriter(message: ResponseRateInsufficientData, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ResponseRateInsufficientData;
  static deserializeBinaryFromReader(message: ResponseRateInsufficientData, reader: jspb.BinaryReader): ResponseRateInsufficientData;
}

export namespace ResponseRateInsufficientData {
  export type AsObject = {
  }
}

export class ResponseRateLow extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ResponseRateLow.AsObject;
  static toObject(includeInstance: boolean, msg: ResponseRateLow): ResponseRateLow.AsObject;
  static serializeBinaryToWriter(message: ResponseRateLow, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ResponseRateLow;
  static deserializeBinaryFromReader(message: ResponseRateLow, reader: jspb.BinaryReader): ResponseRateLow;
}

export namespace ResponseRateLow {
  export type AsObject = {
  }
}

export class ResponseRateSome extends jspb.Message {
  getResponseTimeP33(): google_protobuf_duration_pb.Duration | undefined;
  setResponseTimeP33(value?: google_protobuf_duration_pb.Duration): ResponseRateSome;
  hasResponseTimeP33(): boolean;
  clearResponseTimeP33(): ResponseRateSome;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ResponseRateSome.AsObject;
  static toObject(includeInstance: boolean, msg: ResponseRateSome): ResponseRateSome.AsObject;
  static serializeBinaryToWriter(message: ResponseRateSome, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ResponseRateSome;
  static deserializeBinaryFromReader(message: ResponseRateSome, reader: jspb.BinaryReader): ResponseRateSome;
}

export namespace ResponseRateSome {
  export type AsObject = {
    responseTimeP33?: google_protobuf_duration_pb.Duration.AsObject,
  }
}

export class ResponseRateMost extends jspb.Message {
  getResponseTimeP33(): google_protobuf_duration_pb.Duration | undefined;
  setResponseTimeP33(value?: google_protobuf_duration_pb.Duration): ResponseRateMost;
  hasResponseTimeP33(): boolean;
  clearResponseTimeP33(): ResponseRateMost;

  getResponseTimeP66(): google_protobuf_duration_pb.Duration | undefined;
  setResponseTimeP66(value?: google_protobuf_duration_pb.Duration): ResponseRateMost;
  hasResponseTimeP66(): boolean;
  clearResponseTimeP66(): ResponseRateMost;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ResponseRateMost.AsObject;
  static toObject(includeInstance: boolean, msg: ResponseRateMost): ResponseRateMost.AsObject;
  static serializeBinaryToWriter(message: ResponseRateMost, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ResponseRateMost;
  static deserializeBinaryFromReader(message: ResponseRateMost, reader: jspb.BinaryReader): ResponseRateMost;
}

export namespace ResponseRateMost {
  export type AsObject = {
    responseTimeP33?: google_protobuf_duration_pb.Duration.AsObject,
    responseTimeP66?: google_protobuf_duration_pb.Duration.AsObject,
  }
}

export class ResponseRateAlmostAll extends jspb.Message {
  getResponseTimeP33(): google_protobuf_duration_pb.Duration | undefined;
  setResponseTimeP33(value?: google_protobuf_duration_pb.Duration): ResponseRateAlmostAll;
  hasResponseTimeP33(): boolean;
  clearResponseTimeP33(): ResponseRateAlmostAll;

  getResponseTimeP66(): google_protobuf_duration_pb.Duration | undefined;
  setResponseTimeP66(value?: google_protobuf_duration_pb.Duration): ResponseRateAlmostAll;
  hasResponseTimeP66(): boolean;
  clearResponseTimeP66(): ResponseRateAlmostAll;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ResponseRateAlmostAll.AsObject;
  static toObject(includeInstance: boolean, msg: ResponseRateAlmostAll): ResponseRateAlmostAll.AsObject;
  static serializeBinaryToWriter(message: ResponseRateAlmostAll, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ResponseRateAlmostAll;
  static deserializeBinaryFromReader(message: ResponseRateAlmostAll, reader: jspb.BinaryReader): ResponseRateAlmostAll;
}

export namespace ResponseRateAlmostAll {
  export type AsObject = {
    responseTimeP33?: google_protobuf_duration_pb.Duration.AsObject,
    responseTimeP66?: google_protobuf_duration_pb.Duration.AsObject,
  }
}

export class GetResponseRateRes extends jspb.Message {
  getInsufficientData(): ResponseRateInsufficientData | undefined;
  setInsufficientData(value?: ResponseRateInsufficientData): GetResponseRateRes;
  hasInsufficientData(): boolean;
  clearInsufficientData(): GetResponseRateRes;

  getLow(): ResponseRateLow | undefined;
  setLow(value?: ResponseRateLow): GetResponseRateRes;
  hasLow(): boolean;
  clearLow(): GetResponseRateRes;

  getSome(): ResponseRateSome | undefined;
  setSome(value?: ResponseRateSome): GetResponseRateRes;
  hasSome(): boolean;
  clearSome(): GetResponseRateRes;

  getMost(): ResponseRateMost | undefined;
  setMost(value?: ResponseRateMost): GetResponseRateRes;
  hasMost(): boolean;
  clearMost(): GetResponseRateRes;

  getAlmostAll(): ResponseRateAlmostAll | undefined;
  setAlmostAll(value?: ResponseRateAlmostAll): GetResponseRateRes;
  hasAlmostAll(): boolean;
  clearAlmostAll(): GetResponseRateRes;

  getResponseRateCase(): GetResponseRateRes.ResponseRateCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetResponseRateRes.AsObject;
  static toObject(includeInstance: boolean, msg: GetResponseRateRes): GetResponseRateRes.AsObject;
  static serializeBinaryToWriter(message: GetResponseRateRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetResponseRateRes;
  static deserializeBinaryFromReader(message: GetResponseRateRes, reader: jspb.BinaryReader): GetResponseRateRes;
}

export namespace GetResponseRateRes {
  export type AsObject = {
    insufficientData?: ResponseRateInsufficientData.AsObject,
    low?: ResponseRateLow.AsObject,
    some?: ResponseRateSome.AsObject,
    most?: ResponseRateMost.AsObject,
    almostAll?: ResponseRateAlmostAll.AsObject,
  }

  export enum ResponseRateCase { 
    RESPONSE_RATE_NOT_SET = 0,
    INSUFFICIENT_DATA = 1,
    LOW = 2,
    SOME = 3,
    MOST = 4,
    ALMOST_ALL = 5,
  }
}

