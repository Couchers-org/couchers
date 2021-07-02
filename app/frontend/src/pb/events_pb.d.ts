import * as jspb from 'google-protobuf'

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';
import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';
import * as google_protobuf_wrappers_pb from 'google-protobuf/google/protobuf/wrappers_pb';


export class OnlineEventInformation extends jspb.Message {
  getLink(): string;
  setLink(value: string): OnlineEventInformation;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): OnlineEventInformation.AsObject;
  static toObject(includeInstance: boolean, msg: OnlineEventInformation): OnlineEventInformation.AsObject;
  static serializeBinaryToWriter(message: OnlineEventInformation, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): OnlineEventInformation;
  static deserializeBinaryFromReader(message: OnlineEventInformation, reader: jspb.BinaryReader): OnlineEventInformation;
}

export namespace OnlineEventInformation {
  export type AsObject = {
    link: string,
  }
}

export class OfflineEventInformation extends jspb.Message {
  getAddress(): string;
  setAddress(value: string): OfflineEventInformation;

  getLat(): number;
  setLat(value: number): OfflineEventInformation;

  getLng(): number;
  setLng(value: number): OfflineEventInformation;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): OfflineEventInformation.AsObject;
  static toObject(includeInstance: boolean, msg: OfflineEventInformation): OfflineEventInformation.AsObject;
  static serializeBinaryToWriter(message: OfflineEventInformation, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): OfflineEventInformation;
  static deserializeBinaryFromReader(message: OfflineEventInformation, reader: jspb.BinaryReader): OfflineEventInformation;
}

export namespace OfflineEventInformation {
  export type AsObject = {
    address: string,
    lat: number,
    lng: number,
  }
}

export class Event extends jspb.Message {
  getEventId(): number;
  setEventId(value: number): Event;

  getIsNext(): boolean;
  setIsNext(value: boolean): Event;

  getTitle(): string;
  setTitle(value: string): Event;

  getSlug(): string;
  setSlug(value: string): Event;

  getContent(): string;
  setContent(value: string): Event;

  getPhotoUrl(): string;
  setPhotoUrl(value: string): Event;

  getOnlineInformation(): OnlineEventInformation | undefined;
  setOnlineInformation(value?: OnlineEventInformation): Event;
  hasOnlineInformation(): boolean;
  clearOnlineInformation(): Event;

  getOfflineInformation(): OfflineEventInformation | undefined;
  setOfflineInformation(value?: OfflineEventInformation): Event;
  hasOfflineInformation(): boolean;
  clearOfflineInformation(): Event;

  getCreated(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setCreated(value?: google_protobuf_timestamp_pb.Timestamp): Event;
  hasCreated(): boolean;
  clearCreated(): Event;

  getLastEdited(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setLastEdited(value?: google_protobuf_timestamp_pb.Timestamp): Event;
  hasLastEdited(): boolean;
  clearLastEdited(): Event;

  getCreatorUserId(): number;
  setCreatorUserId(value: number): Event;

  getStartTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setStartTime(value?: google_protobuf_timestamp_pb.Timestamp): Event;
  hasStartTime(): boolean;
  clearStartTime(): Event;

  getEndTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setEndTime(value?: google_protobuf_timestamp_pb.Timestamp): Event;
  hasEndTime(): boolean;
  clearEndTime(): Event;

  getTimezone(): string;
  setTimezone(value: string): Event;

  getStartTimeDisplay(): string;
  setStartTimeDisplay(value: string): Event;

  getEndTimeDisplay(): string;
  setEndTimeDisplay(value: string): Event;

  getAttendanceState(): AttendanceState;
  setAttendanceState(value: AttendanceState): Event;

  getOrganizer(): boolean;
  setOrganizer(value: boolean): Event;

  getSubscriber(): boolean;
  setSubscriber(value: boolean): Event;

  getGoingCount(): number;
  setGoingCount(value: number): Event;

  getMaybeCount(): number;
  setMaybeCount(value: number): Event;

  getOrganizerCount(): number;
  setOrganizerCount(value: number): Event;

  getSubscriberCount(): number;
  setSubscriberCount(value: number): Event;

  getOwnerUserId(): number;
  setOwnerUserId(value: number): Event;

  getOwnerCommunityId(): number;
  setOwnerCommunityId(value: number): Event;

  getOwnerGroupId(): number;
  setOwnerGroupId(value: number): Event;

  getThreadId(): number;
  setThreadId(value: number): Event;

  getCanEdit(): boolean;
  setCanEdit(value: boolean): Event;

  getCanModerate(): boolean;
  setCanModerate(value: boolean): Event;

  getModeCase(): Event.ModeCase;

  getOwnerCase(): Event.OwnerCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Event.AsObject;
  static toObject(includeInstance: boolean, msg: Event): Event.AsObject;
  static serializeBinaryToWriter(message: Event, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Event;
  static deserializeBinaryFromReader(message: Event, reader: jspb.BinaryReader): Event;
}

export namespace Event {
  export type AsObject = {
    eventId: number,
    isNext: boolean,
    title: string,
    slug: string,
    content: string,
    photoUrl: string,
    onlineInformation?: OnlineEventInformation.AsObject,
    offlineInformation?: OfflineEventInformation.AsObject,
    created?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    lastEdited?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    creatorUserId: number,
    startTime?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    endTime?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    timezone: string,
    startTimeDisplay: string,
    endTimeDisplay: string,
    attendanceState: AttendanceState,
    organizer: boolean,
    subscriber: boolean,
    goingCount: number,
    maybeCount: number,
    organizerCount: number,
    subscriberCount: number,
    ownerUserId: number,
    ownerCommunityId: number,
    ownerGroupId: number,
    threadId: number,
    canEdit: boolean,
    canModerate: boolean,
  }

  export enum ModeCase { 
    MODE_NOT_SET = 0,
    ONLINE_INFORMATION = 9,
    OFFLINE_INFORMATION = 10,
  }

  export enum OwnerCase { 
    OWNER_NOT_SET = 0,
    OWNER_USER_ID = 28,
    OWNER_COMMUNITY_ID = 29,
    OWNER_GROUP_ID = 30,
  }
}

export class CreateEventReq extends jspb.Message {
  getTitle(): string;
  setTitle(value: string): CreateEventReq;

  getContent(): string;
  setContent(value: string): CreateEventReq;

  getPhotoKey(): string;
  setPhotoKey(value: string): CreateEventReq;

  getOnlineInformation(): OnlineEventInformation | undefined;
  setOnlineInformation(value?: OnlineEventInformation): CreateEventReq;
  hasOnlineInformation(): boolean;
  clearOnlineInformation(): CreateEventReq;

  getOfflineInformation(): OfflineEventInformation | undefined;
  setOfflineInformation(value?: OfflineEventInformation): CreateEventReq;
  hasOfflineInformation(): boolean;
  clearOfflineInformation(): CreateEventReq;

  getParentCommunityId(): number;
  setParentCommunityId(value: number): CreateEventReq;

  getStartTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setStartTime(value?: google_protobuf_timestamp_pb.Timestamp): CreateEventReq;
  hasStartTime(): boolean;
  clearStartTime(): CreateEventReq;

  getEndTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setEndTime(value?: google_protobuf_timestamp_pb.Timestamp): CreateEventReq;
  hasEndTime(): boolean;
  clearEndTime(): CreateEventReq;

  getTimezone(): string;
  setTimezone(value: string): CreateEventReq;

  getModeCase(): CreateEventReq.ModeCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateEventReq.AsObject;
  static toObject(includeInstance: boolean, msg: CreateEventReq): CreateEventReq.AsObject;
  static serializeBinaryToWriter(message: CreateEventReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateEventReq;
  static deserializeBinaryFromReader(message: CreateEventReq, reader: jspb.BinaryReader): CreateEventReq;
}

export namespace CreateEventReq {
  export type AsObject = {
    title: string,
    content: string,
    photoKey: string,
    onlineInformation?: OnlineEventInformation.AsObject,
    offlineInformation?: OfflineEventInformation.AsObject,
    parentCommunityId: number,
    startTime?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    endTime?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    timezone: string,
  }

  export enum ModeCase { 
    MODE_NOT_SET = 0,
    ONLINE_INFORMATION = 4,
    OFFLINE_INFORMATION = 5,
  }
}

export class ScheduleEventReq extends jspb.Message {
  getEventId(): number;
  setEventId(value: number): ScheduleEventReq;

  getContent(): string;
  setContent(value: string): ScheduleEventReq;

  getPhotoKey(): string;
  setPhotoKey(value: string): ScheduleEventReq;

  getOnlineInformation(): OnlineEventInformation | undefined;
  setOnlineInformation(value?: OnlineEventInformation): ScheduleEventReq;
  hasOnlineInformation(): boolean;
  clearOnlineInformation(): ScheduleEventReq;

  getOfflineInformation(): OfflineEventInformation | undefined;
  setOfflineInformation(value?: OfflineEventInformation): ScheduleEventReq;
  hasOfflineInformation(): boolean;
  clearOfflineInformation(): ScheduleEventReq;

  getStartTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setStartTime(value?: google_protobuf_timestamp_pb.Timestamp): ScheduleEventReq;
  hasStartTime(): boolean;
  clearStartTime(): ScheduleEventReq;

  getEndTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setEndTime(value?: google_protobuf_timestamp_pb.Timestamp): ScheduleEventReq;
  hasEndTime(): boolean;
  clearEndTime(): ScheduleEventReq;

  getTimezone(): string;
  setTimezone(value: string): ScheduleEventReq;

  getModeCase(): ScheduleEventReq.ModeCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ScheduleEventReq.AsObject;
  static toObject(includeInstance: boolean, msg: ScheduleEventReq): ScheduleEventReq.AsObject;
  static serializeBinaryToWriter(message: ScheduleEventReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ScheduleEventReq;
  static deserializeBinaryFromReader(message: ScheduleEventReq, reader: jspb.BinaryReader): ScheduleEventReq;
}

export namespace ScheduleEventReq {
  export type AsObject = {
    eventId: number,
    content: string,
    photoKey: string,
    onlineInformation?: OnlineEventInformation.AsObject,
    offlineInformation?: OfflineEventInformation.AsObject,
    startTime?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    endTime?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    timezone: string,
  }

  export enum ModeCase { 
    MODE_NOT_SET = 0,
    ONLINE_INFORMATION = 4,
    OFFLINE_INFORMATION = 5,
  }
}

export class UpdateEventReq extends jspb.Message {
  getEventId(): number;
  setEventId(value: number): UpdateEventReq;

  getUpdateAllFuture(): boolean;
  setUpdateAllFuture(value: boolean): UpdateEventReq;

  getTitle(): google_protobuf_wrappers_pb.StringValue | undefined;
  setTitle(value?: google_protobuf_wrappers_pb.StringValue): UpdateEventReq;
  hasTitle(): boolean;
  clearTitle(): UpdateEventReq;

  getContent(): google_protobuf_wrappers_pb.StringValue | undefined;
  setContent(value?: google_protobuf_wrappers_pb.StringValue): UpdateEventReq;
  hasContent(): boolean;
  clearContent(): UpdateEventReq;

  getPhotoKey(): google_protobuf_wrappers_pb.StringValue | undefined;
  setPhotoKey(value?: google_protobuf_wrappers_pb.StringValue): UpdateEventReq;
  hasPhotoKey(): boolean;
  clearPhotoKey(): UpdateEventReq;

  getOnlineInformation(): OnlineEventInformation | undefined;
  setOnlineInformation(value?: OnlineEventInformation): UpdateEventReq;
  hasOnlineInformation(): boolean;
  clearOnlineInformation(): UpdateEventReq;

  getOfflineInformation(): OfflineEventInformation | undefined;
  setOfflineInformation(value?: OfflineEventInformation): UpdateEventReq;
  hasOfflineInformation(): boolean;
  clearOfflineInformation(): UpdateEventReq;

  getStartTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setStartTime(value?: google_protobuf_timestamp_pb.Timestamp): UpdateEventReq;
  hasStartTime(): boolean;
  clearStartTime(): UpdateEventReq;

  getEndTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setEndTime(value?: google_protobuf_timestamp_pb.Timestamp): UpdateEventReq;
  hasEndTime(): boolean;
  clearEndTime(): UpdateEventReq;

  getTimezone(): google_protobuf_wrappers_pb.StringValue | undefined;
  setTimezone(value?: google_protobuf_wrappers_pb.StringValue): UpdateEventReq;
  hasTimezone(): boolean;
  clearTimezone(): UpdateEventReq;

  getModeCase(): UpdateEventReq.ModeCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateEventReq.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateEventReq): UpdateEventReq.AsObject;
  static serializeBinaryToWriter(message: UpdateEventReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateEventReq;
  static deserializeBinaryFromReader(message: UpdateEventReq, reader: jspb.BinaryReader): UpdateEventReq;
}

export namespace UpdateEventReq {
  export type AsObject = {
    eventId: number,
    updateAllFuture: boolean,
    title?: google_protobuf_wrappers_pb.StringValue.AsObject,
    content?: google_protobuf_wrappers_pb.StringValue.AsObject,
    photoKey?: google_protobuf_wrappers_pb.StringValue.AsObject,
    onlineInformation?: OnlineEventInformation.AsObject,
    offlineInformation?: OfflineEventInformation.AsObject,
    startTime?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    endTime?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    timezone?: google_protobuf_wrappers_pb.StringValue.AsObject,
  }

  export enum ModeCase { 
    MODE_NOT_SET = 0,
    ONLINE_INFORMATION = 6,
    OFFLINE_INFORMATION = 7,
  }
}

export class GetEventReq extends jspb.Message {
  getEventId(): number;
  setEventId(value: number): GetEventReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetEventReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetEventReq): GetEventReq.AsObject;
  static serializeBinaryToWriter(message: GetEventReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetEventReq;
  static deserializeBinaryFromReader(message: GetEventReq, reader: jspb.BinaryReader): GetEventReq;
}

export namespace GetEventReq {
  export type AsObject = {
    eventId: number,
  }
}

export class ListEventAttendeesReq extends jspb.Message {
  getEventId(): number;
  setEventId(value: number): ListEventAttendeesReq;

  getPageSize(): number;
  setPageSize(value: number): ListEventAttendeesReq;

  getPageToken(): string;
  setPageToken(value: string): ListEventAttendeesReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListEventAttendeesReq.AsObject;
  static toObject(includeInstance: boolean, msg: ListEventAttendeesReq): ListEventAttendeesReq.AsObject;
  static serializeBinaryToWriter(message: ListEventAttendeesReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListEventAttendeesReq;
  static deserializeBinaryFromReader(message: ListEventAttendeesReq, reader: jspb.BinaryReader): ListEventAttendeesReq;
}

export namespace ListEventAttendeesReq {
  export type AsObject = {
    eventId: number,
    pageSize: number,
    pageToken: string,
  }
}

export class ListEventAttendeesRes extends jspb.Message {
  getAttendeeUserIdsList(): Array<number>;
  setAttendeeUserIdsList(value: Array<number>): ListEventAttendeesRes;
  clearAttendeeUserIdsList(): ListEventAttendeesRes;
  addAttendeeUserIds(value: number, index?: number): ListEventAttendeesRes;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListEventAttendeesRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListEventAttendeesRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListEventAttendeesRes): ListEventAttendeesRes.AsObject;
  static serializeBinaryToWriter(message: ListEventAttendeesRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListEventAttendeesRes;
  static deserializeBinaryFromReader(message: ListEventAttendeesRes, reader: jspb.BinaryReader): ListEventAttendeesRes;
}

export namespace ListEventAttendeesRes {
  export type AsObject = {
    attendeeUserIdsList: Array<number>,
    nextPageToken: string,
  }
}

export class ListEventSubscribersReq extends jspb.Message {
  getEventId(): number;
  setEventId(value: number): ListEventSubscribersReq;

  getPageSize(): number;
  setPageSize(value: number): ListEventSubscribersReq;

  getPageToken(): string;
  setPageToken(value: string): ListEventSubscribersReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListEventSubscribersReq.AsObject;
  static toObject(includeInstance: boolean, msg: ListEventSubscribersReq): ListEventSubscribersReq.AsObject;
  static serializeBinaryToWriter(message: ListEventSubscribersReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListEventSubscribersReq;
  static deserializeBinaryFromReader(message: ListEventSubscribersReq, reader: jspb.BinaryReader): ListEventSubscribersReq;
}

export namespace ListEventSubscribersReq {
  export type AsObject = {
    eventId: number,
    pageSize: number,
    pageToken: string,
  }
}

export class ListEventSubscribersRes extends jspb.Message {
  getSubscriberUserIdsList(): Array<number>;
  setSubscriberUserIdsList(value: Array<number>): ListEventSubscribersRes;
  clearSubscriberUserIdsList(): ListEventSubscribersRes;
  addSubscriberUserIds(value: number, index?: number): ListEventSubscribersRes;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListEventSubscribersRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListEventSubscribersRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListEventSubscribersRes): ListEventSubscribersRes.AsObject;
  static serializeBinaryToWriter(message: ListEventSubscribersRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListEventSubscribersRes;
  static deserializeBinaryFromReader(message: ListEventSubscribersRes, reader: jspb.BinaryReader): ListEventSubscribersRes;
}

export namespace ListEventSubscribersRes {
  export type AsObject = {
    subscriberUserIdsList: Array<number>,
    nextPageToken: string,
  }
}

export class ListEventOrganizersReq extends jspb.Message {
  getEventId(): number;
  setEventId(value: number): ListEventOrganizersReq;

  getPageSize(): number;
  setPageSize(value: number): ListEventOrganizersReq;

  getPageToken(): string;
  setPageToken(value: string): ListEventOrganizersReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListEventOrganizersReq.AsObject;
  static toObject(includeInstance: boolean, msg: ListEventOrganizersReq): ListEventOrganizersReq.AsObject;
  static serializeBinaryToWriter(message: ListEventOrganizersReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListEventOrganizersReq;
  static deserializeBinaryFromReader(message: ListEventOrganizersReq, reader: jspb.BinaryReader): ListEventOrganizersReq;
}

export namespace ListEventOrganizersReq {
  export type AsObject = {
    eventId: number,
    pageSize: number,
    pageToken: string,
  }
}

export class ListEventOrganizersRes extends jspb.Message {
  getOrganizerUserIdsList(): Array<number>;
  setOrganizerUserIdsList(value: Array<number>): ListEventOrganizersRes;
  clearOrganizerUserIdsList(): ListEventOrganizersRes;
  addOrganizerUserIds(value: number, index?: number): ListEventOrganizersRes;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListEventOrganizersRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListEventOrganizersRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListEventOrganizersRes): ListEventOrganizersRes.AsObject;
  static serializeBinaryToWriter(message: ListEventOrganizersRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListEventOrganizersRes;
  static deserializeBinaryFromReader(message: ListEventOrganizersRes, reader: jspb.BinaryReader): ListEventOrganizersRes;
}

export namespace ListEventOrganizersRes {
  export type AsObject = {
    organizerUserIdsList: Array<number>,
    nextPageToken: string,
  }
}

export class ListMyEventsReq extends jspb.Message {
  getPast(): boolean;
  setPast(value: boolean): ListMyEventsReq;

  getSubscribed(): boolean;
  setSubscribed(value: boolean): ListMyEventsReq;

  getAttending(): boolean;
  setAttending(value: boolean): ListMyEventsReq;

  getOrganizing(): boolean;
  setOrganizing(value: boolean): ListMyEventsReq;

  getPageSize(): number;
  setPageSize(value: number): ListMyEventsReq;

  getPageToken(): string;
  setPageToken(value: string): ListMyEventsReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListMyEventsReq.AsObject;
  static toObject(includeInstance: boolean, msg: ListMyEventsReq): ListMyEventsReq.AsObject;
  static serializeBinaryToWriter(message: ListMyEventsReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListMyEventsReq;
  static deserializeBinaryFromReader(message: ListMyEventsReq, reader: jspb.BinaryReader): ListMyEventsReq;
}

export namespace ListMyEventsReq {
  export type AsObject = {
    past: boolean,
    subscribed: boolean,
    attending: boolean,
    organizing: boolean,
    pageSize: number,
    pageToken: string,
  }
}

export class ListMyEventsRes extends jspb.Message {
  getEventsList(): Array<Event>;
  setEventsList(value: Array<Event>): ListMyEventsRes;
  clearEventsList(): ListMyEventsRes;
  addEvents(value?: Event, index?: number): Event;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListMyEventsRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListMyEventsRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListMyEventsRes): ListMyEventsRes.AsObject;
  static serializeBinaryToWriter(message: ListMyEventsRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListMyEventsRes;
  static deserializeBinaryFromReader(message: ListMyEventsRes, reader: jspb.BinaryReader): ListMyEventsRes;
}

export namespace ListMyEventsRes {
  export type AsObject = {
    eventsList: Array<Event.AsObject>,
    nextPageToken: string,
  }
}

export class ListEventOccurrencesReq extends jspb.Message {
  getEventId(): number;
  setEventId(value: number): ListEventOccurrencesReq;

  getPast(): boolean;
  setPast(value: boolean): ListEventOccurrencesReq;

  getPageSize(): number;
  setPageSize(value: number): ListEventOccurrencesReq;

  getPageToken(): string;
  setPageToken(value: string): ListEventOccurrencesReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListEventOccurrencesReq.AsObject;
  static toObject(includeInstance: boolean, msg: ListEventOccurrencesReq): ListEventOccurrencesReq.AsObject;
  static serializeBinaryToWriter(message: ListEventOccurrencesReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListEventOccurrencesReq;
  static deserializeBinaryFromReader(message: ListEventOccurrencesReq, reader: jspb.BinaryReader): ListEventOccurrencesReq;
}

export namespace ListEventOccurrencesReq {
  export type AsObject = {
    eventId: number,
    past: boolean,
    pageSize: number,
    pageToken: string,
  }
}

export class ListEventOccurrencesRes extends jspb.Message {
  getEventsList(): Array<Event>;
  setEventsList(value: Array<Event>): ListEventOccurrencesRes;
  clearEventsList(): ListEventOccurrencesRes;
  addEvents(value?: Event, index?: number): Event;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListEventOccurrencesRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListEventOccurrencesRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListEventOccurrencesRes): ListEventOccurrencesRes.AsObject;
  static serializeBinaryToWriter(message: ListEventOccurrencesRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListEventOccurrencesRes;
  static deserializeBinaryFromReader(message: ListEventOccurrencesRes, reader: jspb.BinaryReader): ListEventOccurrencesRes;
}

export namespace ListEventOccurrencesRes {
  export type AsObject = {
    eventsList: Array<Event.AsObject>,
    nextPageToken: string,
  }
}

export class TransferEventReq extends jspb.Message {
  getEventId(): number;
  setEventId(value: number): TransferEventReq;

  getNewOwnerCommunityId(): number;
  setNewOwnerCommunityId(value: number): TransferEventReq;

  getNewOwnerGroupId(): number;
  setNewOwnerGroupId(value: number): TransferEventReq;

  getNewOwnerCase(): TransferEventReq.NewOwnerCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TransferEventReq.AsObject;
  static toObject(includeInstance: boolean, msg: TransferEventReq): TransferEventReq.AsObject;
  static serializeBinaryToWriter(message: TransferEventReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TransferEventReq;
  static deserializeBinaryFromReader(message: TransferEventReq, reader: jspb.BinaryReader): TransferEventReq;
}

export namespace TransferEventReq {
  export type AsObject = {
    eventId: number,
    newOwnerCommunityId: number,
    newOwnerGroupId: number,
  }

  export enum NewOwnerCase { 
    NEW_OWNER_NOT_SET = 0,
    NEW_OWNER_COMMUNITY_ID = 3,
    NEW_OWNER_GROUP_ID = 2,
  }
}

export class SetEventSubscriptionReq extends jspb.Message {
  getEventId(): number;
  setEventId(value: number): SetEventSubscriptionReq;

  getSubscribe(): boolean;
  setSubscribe(value: boolean): SetEventSubscriptionReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SetEventSubscriptionReq.AsObject;
  static toObject(includeInstance: boolean, msg: SetEventSubscriptionReq): SetEventSubscriptionReq.AsObject;
  static serializeBinaryToWriter(message: SetEventSubscriptionReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SetEventSubscriptionReq;
  static deserializeBinaryFromReader(message: SetEventSubscriptionReq, reader: jspb.BinaryReader): SetEventSubscriptionReq;
}

export namespace SetEventSubscriptionReq {
  export type AsObject = {
    eventId: number,
    subscribe: boolean,
  }
}

export class SetEventAttendanceReq extends jspb.Message {
  getEventId(): number;
  setEventId(value: number): SetEventAttendanceReq;

  getAttendanceState(): AttendanceState;
  setAttendanceState(value: AttendanceState): SetEventAttendanceReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SetEventAttendanceReq.AsObject;
  static toObject(includeInstance: boolean, msg: SetEventAttendanceReq): SetEventAttendanceReq.AsObject;
  static serializeBinaryToWriter(message: SetEventAttendanceReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SetEventAttendanceReq;
  static deserializeBinaryFromReader(message: SetEventAttendanceReq, reader: jspb.BinaryReader): SetEventAttendanceReq;
}

export namespace SetEventAttendanceReq {
  export type AsObject = {
    eventId: number,
    attendanceState: AttendanceState,
  }
}

export class InviteEventOrganizerReq extends jspb.Message {
  getEventId(): number;
  setEventId(value: number): InviteEventOrganizerReq;

  getUserId(): number;
  setUserId(value: number): InviteEventOrganizerReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InviteEventOrganizerReq.AsObject;
  static toObject(includeInstance: boolean, msg: InviteEventOrganizerReq): InviteEventOrganizerReq.AsObject;
  static serializeBinaryToWriter(message: InviteEventOrganizerReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InviteEventOrganizerReq;
  static deserializeBinaryFromReader(message: InviteEventOrganizerReq, reader: jspb.BinaryReader): InviteEventOrganizerReq;
}

export namespace InviteEventOrganizerReq {
  export type AsObject = {
    eventId: number,
    userId: number,
  }
}

export class RemoveEventOrganizerReq extends jspb.Message {
  getEventId(): number;
  setEventId(value: number): RemoveEventOrganizerReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RemoveEventOrganizerReq.AsObject;
  static toObject(includeInstance: boolean, msg: RemoveEventOrganizerReq): RemoveEventOrganizerReq.AsObject;
  static serializeBinaryToWriter(message: RemoveEventOrganizerReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RemoveEventOrganizerReq;
  static deserializeBinaryFromReader(message: RemoveEventOrganizerReq, reader: jspb.BinaryReader): RemoveEventOrganizerReq;
}

export namespace RemoveEventOrganizerReq {
  export type AsObject = {
    eventId: number,
  }
}

export enum AttendanceState { 
  ATTENDANCE_STATE_NOT_GOING = 0,
  ATTENDANCE_STATE_MAYBE = 1,
  ATTENDANCE_STATE_GOING = 2,
}
