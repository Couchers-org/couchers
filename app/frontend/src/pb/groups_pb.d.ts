import * as jspb from "google-protobuf";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as google_protobuf_timestamp_pb from "google-protobuf/google/protobuf/timestamp_pb";

import * as pb_discussions_pb from "../pb/discussions_pb";
import * as pb_pages_pb from "../pb/pages_pb";

export class CommunityParent extends jspb.Message {
  getCommunityId(): number;
  setCommunityId(value: number): CommunityParent;

  getName(): string;
  setName(value: string): CommunityParent;

  getSlug(): string;
  setSlug(value: string): CommunityParent;

  getDescription(): string;
  setDescription(value: string): CommunityParent;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CommunityParent.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: CommunityParent
  ): CommunityParent.AsObject;
  static serializeBinaryToWriter(
    message: CommunityParent,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): CommunityParent;
  static deserializeBinaryFromReader(
    message: CommunityParent,
    reader: jspb.BinaryReader
  ): CommunityParent;
}

export namespace CommunityParent {
  export type AsObject = {
    communityId: number;
    name: string;
    slug: string;
    description: string;
  };
}

export class GroupParent extends jspb.Message {
  getGroupId(): number;
  setGroupId(value: number): GroupParent;

  getName(): string;
  setName(value: string): GroupParent;

  getSlug(): string;
  setSlug(value: string): GroupParent;

  getDescription(): string;
  setDescription(value: string): GroupParent;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GroupParent.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: GroupParent
  ): GroupParent.AsObject;
  static serializeBinaryToWriter(
    message: GroupParent,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): GroupParent;
  static deserializeBinaryFromReader(
    message: GroupParent,
    reader: jspb.BinaryReader
  ): GroupParent;
}

export namespace GroupParent {
  export type AsObject = {
    groupId: number;
    name: string;
    slug: string;
    description: string;
  };
}

export class Parent extends jspb.Message {
  getCommunity(): CommunityParent | undefined;
  setCommunity(value?: CommunityParent): Parent;
  hasCommunity(): boolean;
  clearCommunity(): Parent;

  getGroup(): GroupParent | undefined;
  setGroup(value?: GroupParent): Parent;
  hasGroup(): boolean;
  clearGroup(): Parent;

  getParentCase(): Parent.ParentCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Parent.AsObject;
  static toObject(includeInstance: boolean, msg: Parent): Parent.AsObject;
  static serializeBinaryToWriter(
    message: Parent,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): Parent;
  static deserializeBinaryFromReader(
    message: Parent,
    reader: jspb.BinaryReader
  ): Parent;
}

export namespace Parent {
  export type AsObject = {
    community?: CommunityParent.AsObject;
    group?: GroupParent.AsObject;
  };

  export enum ParentCase {
    PARENT_NOT_SET = 0,
    COMMUNITY = 1,
    GROUP = 2,
  }
}

export class Group extends jspb.Message {
  getGroupId(): number;
  setGroupId(value: number): Group;

  getName(): string;
  setName(value: string): Group;

  getSlug(): string;
  setSlug(value: string): Group;

  getDescription(): string;
  setDescription(value: string): Group;

  getCreated(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setCreated(value?: google_protobuf_timestamp_pb.Timestamp): Group;
  hasCreated(): boolean;
  clearCreated(): Group;

  getParentsList(): Array<Parent>;
  setParentsList(value: Array<Parent>): Group;
  clearParentsList(): Group;
  addParents(value?: Parent, index?: number): Parent;

  getMainPage(): pb_pages_pb.Page | undefined;
  setMainPage(value?: pb_pages_pb.Page): Group;
  hasMainPage(): boolean;
  clearMainPage(): Group;

  getMember(): boolean;
  setMember(value: boolean): Group;

  getAdmin(): boolean;
  setAdmin(value: boolean): Group;

  getMemberCount(): number;
  setMemberCount(value: number): Group;

  getAdminCount(): number;
  setAdminCount(value: number): Group;

  getCanModerate(): boolean;
  setCanModerate(value: boolean): Group;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Group.AsObject;
  static toObject(includeInstance: boolean, msg: Group): Group.AsObject;
  static serializeBinaryToWriter(
    message: Group,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): Group;
  static deserializeBinaryFromReader(
    message: Group,
    reader: jspb.BinaryReader
  ): Group;
}

export namespace Group {
  export type AsObject = {
    groupId: number;
    name: string;
    slug: string;
    description: string;
    created?: google_protobuf_timestamp_pb.Timestamp.AsObject;
    parentsList: Array<Parent.AsObject>;
    mainPage?: pb_pages_pb.Page.AsObject;
    member: boolean;
    admin: boolean;
    memberCount: number;
    adminCount: number;
    canModerate: boolean;
  };
}

export class GetGroupReq extends jspb.Message {
  getGroupId(): number;
  setGroupId(value: number): GetGroupReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetGroupReq.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: GetGroupReq
  ): GetGroupReq.AsObject;
  static serializeBinaryToWriter(
    message: GetGroupReq,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): GetGroupReq;
  static deserializeBinaryFromReader(
    message: GetGroupReq,
    reader: jspb.BinaryReader
  ): GetGroupReq;
}

export namespace GetGroupReq {
  export type AsObject = {
    groupId: number;
  };
}

export class ListAdminsReq extends jspb.Message {
  getGroupId(): number;
  setGroupId(value: number): ListAdminsReq;

  getPageSize(): number;
  setPageSize(value: number): ListAdminsReq;

  getPageToken(): string;
  setPageToken(value: string): ListAdminsReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListAdminsReq.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListAdminsReq
  ): ListAdminsReq.AsObject;
  static serializeBinaryToWriter(
    message: ListAdminsReq,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListAdminsReq;
  static deserializeBinaryFromReader(
    message: ListAdminsReq,
    reader: jspb.BinaryReader
  ): ListAdminsReq;
}

export namespace ListAdminsReq {
  export type AsObject = {
    groupId: number;
    pageSize: number;
    pageToken: string;
  };
}

export class ListAdminsRes extends jspb.Message {
  getAdminUserIdsList(): Array<number>;
  setAdminUserIdsList(value: Array<number>): ListAdminsRes;
  clearAdminUserIdsList(): ListAdminsRes;
  addAdminUserIds(value: number, index?: number): ListAdminsRes;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListAdminsRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListAdminsRes.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListAdminsRes
  ): ListAdminsRes.AsObject;
  static serializeBinaryToWriter(
    message: ListAdminsRes,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListAdminsRes;
  static deserializeBinaryFromReader(
    message: ListAdminsRes,
    reader: jspb.BinaryReader
  ): ListAdminsRes;
}

export namespace ListAdminsRes {
  export type AsObject = {
    adminUserIdsList: Array<number>;
    nextPageToken: string;
  };
}

export class ListMembersReq extends jspb.Message {
  getGroupId(): number;
  setGroupId(value: number): ListMembersReq;

  getPageSize(): number;
  setPageSize(value: number): ListMembersReq;

  getPageToken(): string;
  setPageToken(value: string): ListMembersReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListMembersReq.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListMembersReq
  ): ListMembersReq.AsObject;
  static serializeBinaryToWriter(
    message: ListMembersReq,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListMembersReq;
  static deserializeBinaryFromReader(
    message: ListMembersReq,
    reader: jspb.BinaryReader
  ): ListMembersReq;
}

export namespace ListMembersReq {
  export type AsObject = {
    groupId: number;
    pageSize: number;
    pageToken: string;
  };
}

export class ListMembersRes extends jspb.Message {
  getMemberUserIdsList(): Array<number>;
  setMemberUserIdsList(value: Array<number>): ListMembersRes;
  clearMemberUserIdsList(): ListMembersRes;
  addMemberUserIds(value: number, index?: number): ListMembersRes;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListMembersRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListMembersRes.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListMembersRes
  ): ListMembersRes.AsObject;
  static serializeBinaryToWriter(
    message: ListMembersRes,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListMembersRes;
  static deserializeBinaryFromReader(
    message: ListMembersRes,
    reader: jspb.BinaryReader
  ): ListMembersRes;
}

export namespace ListMembersRes {
  export type AsObject = {
    memberUserIdsList: Array<number>;
    nextPageToken: string;
  };
}

export class ListPlacesReq extends jspb.Message {
  getGroupId(): number;
  setGroupId(value: number): ListPlacesReq;

  getPageSize(): number;
  setPageSize(value: number): ListPlacesReq;

  getPageToken(): string;
  setPageToken(value: string): ListPlacesReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListPlacesReq.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListPlacesReq
  ): ListPlacesReq.AsObject;
  static serializeBinaryToWriter(
    message: ListPlacesReq,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListPlacesReq;
  static deserializeBinaryFromReader(
    message: ListPlacesReq,
    reader: jspb.BinaryReader
  ): ListPlacesReq;
}

export namespace ListPlacesReq {
  export type AsObject = {
    groupId: number;
    pageSize: number;
    pageToken: string;
  };
}

export class ListPlacesRes extends jspb.Message {
  getPlacesList(): Array<pb_pages_pb.Page>;
  setPlacesList(value: Array<pb_pages_pb.Page>): ListPlacesRes;
  clearPlacesList(): ListPlacesRes;
  addPlaces(value?: pb_pages_pb.Page, index?: number): pb_pages_pb.Page;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListPlacesRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListPlacesRes.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListPlacesRes
  ): ListPlacesRes.AsObject;
  static serializeBinaryToWriter(
    message: ListPlacesRes,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListPlacesRes;
  static deserializeBinaryFromReader(
    message: ListPlacesRes,
    reader: jspb.BinaryReader
  ): ListPlacesRes;
}

export namespace ListPlacesRes {
  export type AsObject = {
    placesList: Array<pb_pages_pb.Page.AsObject>;
    nextPageToken: string;
  };
}

export class ListGuidesReq extends jspb.Message {
  getGroupId(): number;
  setGroupId(value: number): ListGuidesReq;

  getPageSize(): number;
  setPageSize(value: number): ListGuidesReq;

  getPageToken(): string;
  setPageToken(value: string): ListGuidesReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListGuidesReq.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListGuidesReq
  ): ListGuidesReq.AsObject;
  static serializeBinaryToWriter(
    message: ListGuidesReq,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListGuidesReq;
  static deserializeBinaryFromReader(
    message: ListGuidesReq,
    reader: jspb.BinaryReader
  ): ListGuidesReq;
}

export namespace ListGuidesReq {
  export type AsObject = {
    groupId: number;
    pageSize: number;
    pageToken: string;
  };
}

export class ListGuidesRes extends jspb.Message {
  getGuidesList(): Array<pb_pages_pb.Page>;
  setGuidesList(value: Array<pb_pages_pb.Page>): ListGuidesRes;
  clearGuidesList(): ListGuidesRes;
  addGuides(value?: pb_pages_pb.Page, index?: number): pb_pages_pb.Page;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListGuidesRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListGuidesRes.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListGuidesRes
  ): ListGuidesRes.AsObject;
  static serializeBinaryToWriter(
    message: ListGuidesRes,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListGuidesRes;
  static deserializeBinaryFromReader(
    message: ListGuidesRes,
    reader: jspb.BinaryReader
  ): ListGuidesRes;
}

export namespace ListGuidesRes {
  export type AsObject = {
    guidesList: Array<pb_pages_pb.Page.AsObject>;
    nextPageToken: string;
  };
}

export class ListEventsReq extends jspb.Message {
  getGroupId(): number;
  setGroupId(value: number): ListEventsReq;

  getPageSize(): number;
  setPageSize(value: number): ListEventsReq;

  getPageToken(): string;
  setPageToken(value: string): ListEventsReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListEventsReq.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListEventsReq
  ): ListEventsReq.AsObject;
  static serializeBinaryToWriter(
    message: ListEventsReq,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListEventsReq;
  static deserializeBinaryFromReader(
    message: ListEventsReq,
    reader: jspb.BinaryReader
  ): ListEventsReq;
}

export namespace ListEventsReq {
  export type AsObject = {
    groupId: number;
    pageSize: number;
    pageToken: string;
  };
}

export class Event extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Event.AsObject;
  static toObject(includeInstance: boolean, msg: Event): Event.AsObject;
  static serializeBinaryToWriter(
    message: Event,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): Event;
  static deserializeBinaryFromReader(
    message: Event,
    reader: jspb.BinaryReader
  ): Event;
}

export namespace Event {
  export type AsObject = {};
}

export class ListEventsRes extends jspb.Message {
  getEventsList(): Array<Event>;
  setEventsList(value: Array<Event>): ListEventsRes;
  clearEventsList(): ListEventsRes;
  addEvents(value?: Event, index?: number): Event;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListEventsRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListEventsRes.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListEventsRes
  ): ListEventsRes.AsObject;
  static serializeBinaryToWriter(
    message: ListEventsRes,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListEventsRes;
  static deserializeBinaryFromReader(
    message: ListEventsRes,
    reader: jspb.BinaryReader
  ): ListEventsRes;
}

export namespace ListEventsRes {
  export type AsObject = {
    eventsList: Array<Event.AsObject>;
    nextPageToken: string;
  };
}

export class ListDiscussionsReq extends jspb.Message {
  getGroupId(): number;
  setGroupId(value: number): ListDiscussionsReq;

  getPageSize(): number;
  setPageSize(value: number): ListDiscussionsReq;

  getPageToken(): string;
  setPageToken(value: string): ListDiscussionsReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListDiscussionsReq.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListDiscussionsReq
  ): ListDiscussionsReq.AsObject;
  static serializeBinaryToWriter(
    message: ListDiscussionsReq,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListDiscussionsReq;
  static deserializeBinaryFromReader(
    message: ListDiscussionsReq,
    reader: jspb.BinaryReader
  ): ListDiscussionsReq;
}

export namespace ListDiscussionsReq {
  export type AsObject = {
    groupId: number;
    pageSize: number;
    pageToken: string;
  };
}

export class ListDiscussionsRes extends jspb.Message {
  getDiscussionsList(): Array<pb_discussions_pb.Discussion>;
  setDiscussionsList(
    value: Array<pb_discussions_pb.Discussion>
  ): ListDiscussionsRes;
  clearDiscussionsList(): ListDiscussionsRes;
  addDiscussions(
    value?: pb_discussions_pb.Discussion,
    index?: number
  ): pb_discussions_pb.Discussion;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListDiscussionsRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListDiscussionsRes.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListDiscussionsRes
  ): ListDiscussionsRes.AsObject;
  static serializeBinaryToWriter(
    message: ListDiscussionsRes,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListDiscussionsRes;
  static deserializeBinaryFromReader(
    message: ListDiscussionsRes,
    reader: jspb.BinaryReader
  ): ListDiscussionsRes;
}

export namespace ListDiscussionsRes {
  export type AsObject = {
    discussionsList: Array<pb_discussions_pb.Discussion.AsObject>;
    nextPageToken: string;
  };
}

export class JoinGroupReq extends jspb.Message {
  getGroupId(): number;
  setGroupId(value: number): JoinGroupReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): JoinGroupReq.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: JoinGroupReq
  ): JoinGroupReq.AsObject;
  static serializeBinaryToWriter(
    message: JoinGroupReq,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): JoinGroupReq;
  static deserializeBinaryFromReader(
    message: JoinGroupReq,
    reader: jspb.BinaryReader
  ): JoinGroupReq;
}

export namespace JoinGroupReq {
  export type AsObject = {
    groupId: number;
  };
}

export class LeaveGroupReq extends jspb.Message {
  getGroupId(): number;
  setGroupId(value: number): LeaveGroupReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LeaveGroupReq.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: LeaveGroupReq
  ): LeaveGroupReq.AsObject;
  static serializeBinaryToWriter(
    message: LeaveGroupReq,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): LeaveGroupReq;
  static deserializeBinaryFromReader(
    message: LeaveGroupReq,
    reader: jspb.BinaryReader
  ): LeaveGroupReq;
}

export namespace LeaveGroupReq {
  export type AsObject = {
    groupId: number;
  };
}

export class ListUserGroupsReq extends jspb.Message {
  getUserId(): number;
  setUserId(value: number): ListUserGroupsReq;

  getPageSize(): number;
  setPageSize(value: number): ListUserGroupsReq;

  getPageToken(): string;
  setPageToken(value: string): ListUserGroupsReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListUserGroupsReq.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListUserGroupsReq
  ): ListUserGroupsReq.AsObject;
  static serializeBinaryToWriter(
    message: ListUserGroupsReq,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListUserGroupsReq;
  static deserializeBinaryFromReader(
    message: ListUserGroupsReq,
    reader: jspb.BinaryReader
  ): ListUserGroupsReq;
}

export namespace ListUserGroupsReq {
  export type AsObject = {
    userId: number;
    pageSize: number;
    pageToken: string;
  };
}

export class ListUserGroupsRes extends jspb.Message {
  getGroupsList(): Array<Group>;
  setGroupsList(value: Array<Group>): ListUserGroupsRes;
  clearGroupsList(): ListUserGroupsRes;
  addGroups(value?: Group, index?: number): Group;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListUserGroupsRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListUserGroupsRes.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListUserGroupsRes
  ): ListUserGroupsRes.AsObject;
  static serializeBinaryToWriter(
    message: ListUserGroupsRes,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListUserGroupsRes;
  static deserializeBinaryFromReader(
    message: ListUserGroupsRes,
    reader: jspb.BinaryReader
  ): ListUserGroupsRes;
}

export namespace ListUserGroupsRes {
  export type AsObject = {
    groupsList: Array<Group.AsObject>;
    nextPageToken: string;
  };
}
