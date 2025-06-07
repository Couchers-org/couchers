import * as jspb from 'google-protobuf'

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as annotations_pb from './annotations_pb'; // proto import: "annotations.proto"


export class InitiateDonationReq extends jspb.Message {
  getAmount(): number;
  setAmount(value: number): InitiateDonationReq;

  getRecurring(): boolean;
  setRecurring(value: boolean): InitiateDonationReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InitiateDonationReq.AsObject;
  static toObject(includeInstance: boolean, msg: InitiateDonationReq): InitiateDonationReq.AsObject;
  static serializeBinaryToWriter(message: InitiateDonationReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InitiateDonationReq;
  static deserializeBinaryFromReader(message: InitiateDonationReq, reader: jspb.BinaryReader): InitiateDonationReq;
}

export namespace InitiateDonationReq {
  export type AsObject = {
    amount: number,
    recurring: boolean,
  }
}

export class InitiateDonationRes extends jspb.Message {
  getStripeCheckoutSessionId(): string;
  setStripeCheckoutSessionId(value: string): InitiateDonationRes;

  getStripeCheckoutUrl(): string;
  setStripeCheckoutUrl(value: string): InitiateDonationRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InitiateDonationRes.AsObject;
  static toObject(includeInstance: boolean, msg: InitiateDonationRes): InitiateDonationRes.AsObject;
  static serializeBinaryToWriter(message: InitiateDonationRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InitiateDonationRes;
  static deserializeBinaryFromReader(message: InitiateDonationRes, reader: jspb.BinaryReader): InitiateDonationRes;
}

export namespace InitiateDonationRes {
  export type AsObject = {
    stripeCheckoutSessionId: string,
    stripeCheckoutUrl: string,
  }
}

export class GetDonationPortalLinkRes extends jspb.Message {
  getStripePortalUrl(): string;
  setStripePortalUrl(value: string): GetDonationPortalLinkRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetDonationPortalLinkRes.AsObject;
  static toObject(includeInstance: boolean, msg: GetDonationPortalLinkRes): GetDonationPortalLinkRes.AsObject;
  static serializeBinaryToWriter(message: GetDonationPortalLinkRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetDonationPortalLinkRes;
  static deserializeBinaryFromReader(message: GetDonationPortalLinkRes, reader: jspb.BinaryReader): GetDonationPortalLinkRes;
}

export namespace GetDonationPortalLinkRes {
  export type AsObject = {
    stripePortalUrl: string,
  }
}

