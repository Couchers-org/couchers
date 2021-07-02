import * as jspb from 'google-protobuf'

import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';
import * as google_protobuf_wrappers_pb from 'google-protobuf/google/protobuf/wrappers_pb';
import * as pb_threads_pb from '../pb/threads_pb';


export class Coordinate extends jspb.Message {
  getLat(): number;
  setLat(value: number): Coordinate;

  getLng(): number;
  setLng(value: number): Coordinate;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Coordinate.AsObject;
  static toObject(includeInstance: boolean, msg: Coordinate): Coordinate.AsObject;
  static serializeBinaryToWriter(message: Coordinate, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Coordinate;
  static deserializeBinaryFromReader(message: Coordinate, reader: jspb.BinaryReader): Coordinate;
}

export namespace Coordinate {
  export type AsObject = {
    lat: number,
    lng: number,
  }
}

export class Page extends jspb.Message {
  getPageId(): number;
  setPageId(value: number): Page;

  getType(): PageType;
  setType(value: PageType): Page;

  getSlug(): string;
  setSlug(value: string): Page;

  getCreated(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setCreated(value?: google_protobuf_timestamp_pb.Timestamp): Page;
  hasCreated(): boolean;
  clearCreated(): Page;

  getLastEdited(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setLastEdited(value?: google_protobuf_timestamp_pb.Timestamp): Page;
  hasLastEdited(): boolean;
  clearLastEdited(): Page;

  getLastEditorUserId(): number;
  setLastEditorUserId(value: number): Page;

  getCreatorUserId(): number;
  setCreatorUserId(value: number): Page;

  getOwnerUserId(): number;
  setOwnerUserId(value: number): Page;

  getOwnerCommunityId(): number;
  setOwnerCommunityId(value: number): Page;

  getOwnerGroupId(): number;
  setOwnerGroupId(value: number): Page;

  getThread(): pb_threads_pb.Thread | undefined;
  setThread(value?: pb_threads_pb.Thread): Page;
  hasThread(): boolean;
  clearThread(): Page;

  getTitle(): string;
  setTitle(value: string): Page;

  getContent(): string;
  setContent(value: string): Page;

  getPhotoUrl(): string;
  setPhotoUrl(value: string): Page;

  getAddress(): string;
  setAddress(value: string): Page;

  getLocation(): Coordinate | undefined;
  setLocation(value?: Coordinate): Page;
  hasLocation(): boolean;
  clearLocation(): Page;

  getEditorUserIdsList(): Array<number>;
  setEditorUserIdsList(value: Array<number>): Page;
  clearEditorUserIdsList(): Page;
  addEditorUserIds(value: number, index?: number): Page;

  getCanEdit(): boolean;
  setCanEdit(value: boolean): Page;

  getCanModerate(): boolean;
  setCanModerate(value: boolean): Page;

  getOwnerCase(): Page.OwnerCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Page.AsObject;
  static toObject(includeInstance: boolean, msg: Page): Page.AsObject;
  static serializeBinaryToWriter(message: Page, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Page;
  static deserializeBinaryFromReader(message: Page, reader: jspb.BinaryReader): Page;
}

export namespace Page {
  export type AsObject = {
    pageId: number,
    type: PageType,
    slug: string,
    created?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    lastEdited?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    lastEditorUserId: number,
    creatorUserId: number,
    ownerUserId: number,
    ownerCommunityId: number,
    ownerGroupId: number,
    thread?: pb_threads_pb.Thread.AsObject,
    title: string,
    content: string,
    photoUrl: string,
    address: string,
    location?: Coordinate.AsObject,
    editorUserIdsList: Array<number>,
    canEdit: boolean,
    canModerate: boolean,
  }

  export enum OwnerCase { 
    OWNER_NOT_SET = 0,
    OWNER_USER_ID = 8,
    OWNER_COMMUNITY_ID = 17,
    OWNER_GROUP_ID = 9,
  }
}

export class CreatePlaceReq extends jspb.Message {
  getTitle(): string;
  setTitle(value: string): CreatePlaceReq;

  getContent(): string;
  setContent(value: string): CreatePlaceReq;

  getPhotoKey(): string;
  setPhotoKey(value: string): CreatePlaceReq;

  getAddress(): string;
  setAddress(value: string): CreatePlaceReq;

  getLocation(): Coordinate | undefined;
  setLocation(value?: Coordinate): CreatePlaceReq;
  hasLocation(): boolean;
  clearLocation(): CreatePlaceReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreatePlaceReq.AsObject;
  static toObject(includeInstance: boolean, msg: CreatePlaceReq): CreatePlaceReq.AsObject;
  static serializeBinaryToWriter(message: CreatePlaceReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreatePlaceReq;
  static deserializeBinaryFromReader(message: CreatePlaceReq, reader: jspb.BinaryReader): CreatePlaceReq;
}

export namespace CreatePlaceReq {
  export type AsObject = {
    title: string,
    content: string,
    photoKey: string,
    address: string,
    location?: Coordinate.AsObject,
  }
}

export class CreateGuideReq extends jspb.Message {
  getTitle(): string;
  setTitle(value: string): CreateGuideReq;

  getContent(): string;
  setContent(value: string): CreateGuideReq;

  getPhotoKey(): string;
  setPhotoKey(value: string): CreateGuideReq;

  getParentCommunityId(): number;
  setParentCommunityId(value: number): CreateGuideReq;

  getAddress(): string;
  setAddress(value: string): CreateGuideReq;

  getLocation(): Coordinate | undefined;
  setLocation(value?: Coordinate): CreateGuideReq;
  hasLocation(): boolean;
  clearLocation(): CreateGuideReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateGuideReq.AsObject;
  static toObject(includeInstance: boolean, msg: CreateGuideReq): CreateGuideReq.AsObject;
  static serializeBinaryToWriter(message: CreateGuideReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateGuideReq;
  static deserializeBinaryFromReader(message: CreateGuideReq, reader: jspb.BinaryReader): CreateGuideReq;
}

export namespace CreateGuideReq {
  export type AsObject = {
    title: string,
    content: string,
    photoKey: string,
    parentCommunityId: number,
    address: string,
    location?: Coordinate.AsObject,
  }
}

export class GetPageReq extends jspb.Message {
  getPageId(): number;
  setPageId(value: number): GetPageReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetPageReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetPageReq): GetPageReq.AsObject;
  static serializeBinaryToWriter(message: GetPageReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetPageReq;
  static deserializeBinaryFromReader(message: GetPageReq, reader: jspb.BinaryReader): GetPageReq;
}

export namespace GetPageReq {
  export type AsObject = {
    pageId: number,
  }
}

export class UpdatePageReq extends jspb.Message {
  getPageId(): number;
  setPageId(value: number): UpdatePageReq;

  getTitle(): google_protobuf_wrappers_pb.StringValue | undefined;
  setTitle(value?: google_protobuf_wrappers_pb.StringValue): UpdatePageReq;
  hasTitle(): boolean;
  clearTitle(): UpdatePageReq;

  getContent(): google_protobuf_wrappers_pb.StringValue | undefined;
  setContent(value?: google_protobuf_wrappers_pb.StringValue): UpdatePageReq;
  hasContent(): boolean;
  clearContent(): UpdatePageReq;

  getPhotoKey(): google_protobuf_wrappers_pb.StringValue | undefined;
  setPhotoKey(value?: google_protobuf_wrappers_pb.StringValue): UpdatePageReq;
  hasPhotoKey(): boolean;
  clearPhotoKey(): UpdatePageReq;

  getAddress(): google_protobuf_wrappers_pb.StringValue | undefined;
  setAddress(value?: google_protobuf_wrappers_pb.StringValue): UpdatePageReq;
  hasAddress(): boolean;
  clearAddress(): UpdatePageReq;

  getLocation(): Coordinate | undefined;
  setLocation(value?: Coordinate): UpdatePageReq;
  hasLocation(): boolean;
  clearLocation(): UpdatePageReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdatePageReq.AsObject;
  static toObject(includeInstance: boolean, msg: UpdatePageReq): UpdatePageReq.AsObject;
  static serializeBinaryToWriter(message: UpdatePageReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdatePageReq;
  static deserializeBinaryFromReader(message: UpdatePageReq, reader: jspb.BinaryReader): UpdatePageReq;
}

export namespace UpdatePageReq {
  export type AsObject = {
    pageId: number,
    title?: google_protobuf_wrappers_pb.StringValue.AsObject,
    content?: google_protobuf_wrappers_pb.StringValue.AsObject,
    photoKey?: google_protobuf_wrappers_pb.StringValue.AsObject,
    address?: google_protobuf_wrappers_pb.StringValue.AsObject,
    location?: Coordinate.AsObject,
  }
}

export class TransferPageReq extends jspb.Message {
  getPageId(): number;
  setPageId(value: number): TransferPageReq;

  getNewOwnerCommunityId(): number;
  setNewOwnerCommunityId(value: number): TransferPageReq;

  getNewOwnerGroupId(): number;
  setNewOwnerGroupId(value: number): TransferPageReq;

  getNewOwnerCase(): TransferPageReq.NewOwnerCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TransferPageReq.AsObject;
  static toObject(includeInstance: boolean, msg: TransferPageReq): TransferPageReq.AsObject;
  static serializeBinaryToWriter(message: TransferPageReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TransferPageReq;
  static deserializeBinaryFromReader(message: TransferPageReq, reader: jspb.BinaryReader): TransferPageReq;
}

export namespace TransferPageReq {
  export type AsObject = {
    pageId: number,
    newOwnerCommunityId: number,
    newOwnerGroupId: number,
  }

  export enum NewOwnerCase { 
    NEW_OWNER_NOT_SET = 0,
    NEW_OWNER_COMMUNITY_ID = 3,
    NEW_OWNER_GROUP_ID = 2,
  }
}

export class ListUserPlacesReq extends jspb.Message {
  getUserId(): number;
  setUserId(value: number): ListUserPlacesReq;

  getPageSize(): number;
  setPageSize(value: number): ListUserPlacesReq;

  getPageToken(): string;
  setPageToken(value: string): ListUserPlacesReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListUserPlacesReq.AsObject;
  static toObject(includeInstance: boolean, msg: ListUserPlacesReq): ListUserPlacesReq.AsObject;
  static serializeBinaryToWriter(message: ListUserPlacesReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListUserPlacesReq;
  static deserializeBinaryFromReader(message: ListUserPlacesReq, reader: jspb.BinaryReader): ListUserPlacesReq;
}

export namespace ListUserPlacesReq {
  export type AsObject = {
    userId: number,
    pageSize: number,
    pageToken: string,
  }
}

export class ListUserPlacesRes extends jspb.Message {
  getPlacesList(): Array<Page>;
  setPlacesList(value: Array<Page>): ListUserPlacesRes;
  clearPlacesList(): ListUserPlacesRes;
  addPlaces(value?: Page, index?: number): Page;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListUserPlacesRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListUserPlacesRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListUserPlacesRes): ListUserPlacesRes.AsObject;
  static serializeBinaryToWriter(message: ListUserPlacesRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListUserPlacesRes;
  static deserializeBinaryFromReader(message: ListUserPlacesRes, reader: jspb.BinaryReader): ListUserPlacesRes;
}

export namespace ListUserPlacesRes {
  export type AsObject = {
    placesList: Array<Page.AsObject>,
    nextPageToken: string,
  }
}

export class ListUserGuidesReq extends jspb.Message {
  getUserId(): number;
  setUserId(value: number): ListUserGuidesReq;

  getPageSize(): number;
  setPageSize(value: number): ListUserGuidesReq;

  getPageToken(): string;
  setPageToken(value: string): ListUserGuidesReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListUserGuidesReq.AsObject;
  static toObject(includeInstance: boolean, msg: ListUserGuidesReq): ListUserGuidesReq.AsObject;
  static serializeBinaryToWriter(message: ListUserGuidesReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListUserGuidesReq;
  static deserializeBinaryFromReader(message: ListUserGuidesReq, reader: jspb.BinaryReader): ListUserGuidesReq;
}

export namespace ListUserGuidesReq {
  export type AsObject = {
    userId: number,
    pageSize: number,
    pageToken: string,
  }
}

export class ListUserGuidesRes extends jspb.Message {
  getGuidesList(): Array<Page>;
  setGuidesList(value: Array<Page>): ListUserGuidesRes;
  clearGuidesList(): ListUserGuidesRes;
  addGuides(value?: Page, index?: number): Page;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListUserGuidesRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListUserGuidesRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListUserGuidesRes): ListUserGuidesRes.AsObject;
  static serializeBinaryToWriter(message: ListUserGuidesRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListUserGuidesRes;
  static deserializeBinaryFromReader(message: ListUserGuidesRes, reader: jspb.BinaryReader): ListUserGuidesRes;
}

export namespace ListUserGuidesRes {
  export type AsObject = {
    guidesList: Array<Page.AsObject>,
    nextPageToken: string,
  }
}

export enum PageType { 
  PAGE_TYPE_PLACE = 0,
  PAGE_TYPE_GUIDE = 1,
  PAGE_TYPE_MAIN_PAGE = 2,
}
