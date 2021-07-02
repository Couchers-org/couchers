import * as jspb from 'google-protobuf'

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';
import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';
import * as pb_discussions_pb from '../pb/discussions_pb';
import * as pb_groups_pb from '../pb/groups_pb';
import * as pb_pages_pb from '../pb/pages_pb';


export class Community extends jspb.Message {
  getCommunityId(): number;
  setCommunityId(value: number): Community;

  getName(): string;
  setName(value: string): Community;

  getSlug(): string;
  setSlug(value: string): Community;

  getDescription(): string;
  setDescription(value: string): Community;

  getCreated(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setCreated(value?: google_protobuf_timestamp_pb.Timestamp): Community;
  hasCreated(): boolean;
  clearCreated(): Community;

  getParentsList(): Array<pb_groups_pb.Parent>;
  setParentsList(value: Array<pb_groups_pb.Parent>): Community;
  clearParentsList(): Community;
  addParents(value?: pb_groups_pb.Parent, index?: number): pb_groups_pb.Parent;

  getMainPage(): pb_pages_pb.Page | undefined;
  setMainPage(value?: pb_pages_pb.Page): Community;
  hasMainPage(): boolean;
  clearMainPage(): Community;

  getMember(): boolean;
  setMember(value: boolean): Community;

  getAdmin(): boolean;
  setAdmin(value: boolean): Community;

  getMemberCount(): number;
  setMemberCount(value: number): Community;

  getAdminCount(): number;
  setAdminCount(value: number): Community;

  getNearbyUserCount(): number;
  setNearbyUserCount(value: number): Community;

  getCanModerate(): boolean;
  setCanModerate(value: boolean): Community;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Community.AsObject;
  static toObject(includeInstance: boolean, msg: Community): Community.AsObject;
  static serializeBinaryToWriter(message: Community, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Community;
  static deserializeBinaryFromReader(message: Community, reader: jspb.BinaryReader): Community;
}

export namespace Community {
  export type AsObject = {
    communityId: number,
    name: string,
    slug: string,
    description: string,
    created?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    parentsList: Array<pb_groups_pb.Parent.AsObject>,
    mainPage?: pb_pages_pb.Page.AsObject,
    member: boolean,
    admin: boolean,
    memberCount: number,
    adminCount: number,
    nearbyUserCount: number,
    canModerate: boolean,
  }
}

export class GetCommunityReq extends jspb.Message {
  getCommunityId(): number;
  setCommunityId(value: number): GetCommunityReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetCommunityReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetCommunityReq): GetCommunityReq.AsObject;
  static serializeBinaryToWriter(message: GetCommunityReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetCommunityReq;
  static deserializeBinaryFromReader(message: GetCommunityReq, reader: jspb.BinaryReader): GetCommunityReq;
}

export namespace GetCommunityReq {
  export type AsObject = {
    communityId: number,
  }
}

export class ListCommunitiesReq extends jspb.Message {
  getCommunityId(): number;
  setCommunityId(value: number): ListCommunitiesReq;

  getPageSize(): number;
  setPageSize(value: number): ListCommunitiesReq;

  getPageToken(): string;
  setPageToken(value: string): ListCommunitiesReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListCommunitiesReq.AsObject;
  static toObject(includeInstance: boolean, msg: ListCommunitiesReq): ListCommunitiesReq.AsObject;
  static serializeBinaryToWriter(message: ListCommunitiesReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListCommunitiesReq;
  static deserializeBinaryFromReader(message: ListCommunitiesReq, reader: jspb.BinaryReader): ListCommunitiesReq;
}

export namespace ListCommunitiesReq {
  export type AsObject = {
    communityId: number,
    pageSize: number,
    pageToken: string,
  }
}

export class ListCommunitiesRes extends jspb.Message {
  getCommunitiesList(): Array<Community>;
  setCommunitiesList(value: Array<Community>): ListCommunitiesRes;
  clearCommunitiesList(): ListCommunitiesRes;
  addCommunities(value?: Community, index?: number): Community;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListCommunitiesRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListCommunitiesRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListCommunitiesRes): ListCommunitiesRes.AsObject;
  static serializeBinaryToWriter(message: ListCommunitiesRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListCommunitiesRes;
  static deserializeBinaryFromReader(message: ListCommunitiesRes, reader: jspb.BinaryReader): ListCommunitiesRes;
}

export namespace ListCommunitiesRes {
  export type AsObject = {
    communitiesList: Array<Community.AsObject>,
    nextPageToken: string,
  }
}

export class ListUserCommunitiesReq extends jspb.Message {
  getUserId(): number;
  setUserId(value: number): ListUserCommunitiesReq;

  getPageSize(): number;
  setPageSize(value: number): ListUserCommunitiesReq;

  getPageToken(): string;
  setPageToken(value: string): ListUserCommunitiesReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListUserCommunitiesReq.AsObject;
  static toObject(includeInstance: boolean, msg: ListUserCommunitiesReq): ListUserCommunitiesReq.AsObject;
  static serializeBinaryToWriter(message: ListUserCommunitiesReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListUserCommunitiesReq;
  static deserializeBinaryFromReader(message: ListUserCommunitiesReq, reader: jspb.BinaryReader): ListUserCommunitiesReq;
}

export namespace ListUserCommunitiesReq {
  export type AsObject = {
    userId: number,
    pageSize: number,
    pageToken: string,
  }
}

export class ListUserCommunitiesRes extends jspb.Message {
  getCommunitiesList(): Array<Community>;
  setCommunitiesList(value: Array<Community>): ListUserCommunitiesRes;
  clearCommunitiesList(): ListUserCommunitiesRes;
  addCommunities(value?: Community, index?: number): Community;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListUserCommunitiesRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListUserCommunitiesRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListUserCommunitiesRes): ListUserCommunitiesRes.AsObject;
  static serializeBinaryToWriter(message: ListUserCommunitiesRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListUserCommunitiesRes;
  static deserializeBinaryFromReader(message: ListUserCommunitiesRes, reader: jspb.BinaryReader): ListUserCommunitiesRes;
}

export namespace ListUserCommunitiesRes {
  export type AsObject = {
    communitiesList: Array<Community.AsObject>,
    nextPageToken: string,
  }
}

export class ListGroupsReq extends jspb.Message {
  getCommunityId(): number;
  setCommunityId(value: number): ListGroupsReq;

  getPageSize(): number;
  setPageSize(value: number): ListGroupsReq;

  getPageToken(): string;
  setPageToken(value: string): ListGroupsReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListGroupsReq.AsObject;
  static toObject(includeInstance: boolean, msg: ListGroupsReq): ListGroupsReq.AsObject;
  static serializeBinaryToWriter(message: ListGroupsReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListGroupsReq;
  static deserializeBinaryFromReader(message: ListGroupsReq, reader: jspb.BinaryReader): ListGroupsReq;
}

export namespace ListGroupsReq {
  export type AsObject = {
    communityId: number,
    pageSize: number,
    pageToken: string,
  }
}

export class ListGroupsRes extends jspb.Message {
  getGroupsList(): Array<pb_groups_pb.Group>;
  setGroupsList(value: Array<pb_groups_pb.Group>): ListGroupsRes;
  clearGroupsList(): ListGroupsRes;
  addGroups(value?: pb_groups_pb.Group, index?: number): pb_groups_pb.Group;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListGroupsRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListGroupsRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListGroupsRes): ListGroupsRes.AsObject;
  static serializeBinaryToWriter(message: ListGroupsRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListGroupsRes;
  static deserializeBinaryFromReader(message: ListGroupsRes, reader: jspb.BinaryReader): ListGroupsRes;
}

export namespace ListGroupsRes {
  export type AsObject = {
    groupsList: Array<pb_groups_pb.Group.AsObject>,
    nextPageToken: string,
  }
}

export class ListAdminsReq extends jspb.Message {
  getCommunityId(): number;
  setCommunityId(value: number): ListAdminsReq;

  getPageSize(): number;
  setPageSize(value: number): ListAdminsReq;

  getPageToken(): string;
  setPageToken(value: string): ListAdminsReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListAdminsReq.AsObject;
  static toObject(includeInstance: boolean, msg: ListAdminsReq): ListAdminsReq.AsObject;
  static serializeBinaryToWriter(message: ListAdminsReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListAdminsReq;
  static deserializeBinaryFromReader(message: ListAdminsReq, reader: jspb.BinaryReader): ListAdminsReq;
}

export namespace ListAdminsReq {
  export type AsObject = {
    communityId: number,
    pageSize: number,
    pageToken: string,
  }
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
  static toObject(includeInstance: boolean, msg: ListAdminsRes): ListAdminsRes.AsObject;
  static serializeBinaryToWriter(message: ListAdminsRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListAdminsRes;
  static deserializeBinaryFromReader(message: ListAdminsRes, reader: jspb.BinaryReader): ListAdminsRes;
}

export namespace ListAdminsRes {
  export type AsObject = {
    adminUserIdsList: Array<number>,
    nextPageToken: string,
  }
}

export class ListMembersReq extends jspb.Message {
  getCommunityId(): number;
  setCommunityId(value: number): ListMembersReq;

  getPageSize(): number;
  setPageSize(value: number): ListMembersReq;

  getPageToken(): string;
  setPageToken(value: string): ListMembersReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListMembersReq.AsObject;
  static toObject(includeInstance: boolean, msg: ListMembersReq): ListMembersReq.AsObject;
  static serializeBinaryToWriter(message: ListMembersReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListMembersReq;
  static deserializeBinaryFromReader(message: ListMembersReq, reader: jspb.BinaryReader): ListMembersReq;
}

export namespace ListMembersReq {
  export type AsObject = {
    communityId: number,
    pageSize: number,
    pageToken: string,
  }
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
  static toObject(includeInstance: boolean, msg: ListMembersRes): ListMembersRes.AsObject;
  static serializeBinaryToWriter(message: ListMembersRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListMembersRes;
  static deserializeBinaryFromReader(message: ListMembersRes, reader: jspb.BinaryReader): ListMembersRes;
}

export namespace ListMembersRes {
  export type AsObject = {
    memberUserIdsList: Array<number>,
    nextPageToken: string,
  }
}

export class ListNearbyUsersReq extends jspb.Message {
  getCommunityId(): number;
  setCommunityId(value: number): ListNearbyUsersReq;

  getPageSize(): number;
  setPageSize(value: number): ListNearbyUsersReq;

  getPageToken(): string;
  setPageToken(value: string): ListNearbyUsersReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListNearbyUsersReq.AsObject;
  static toObject(includeInstance: boolean, msg: ListNearbyUsersReq): ListNearbyUsersReq.AsObject;
  static serializeBinaryToWriter(message: ListNearbyUsersReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListNearbyUsersReq;
  static deserializeBinaryFromReader(message: ListNearbyUsersReq, reader: jspb.BinaryReader): ListNearbyUsersReq;
}

export namespace ListNearbyUsersReq {
  export type AsObject = {
    communityId: number,
    pageSize: number,
    pageToken: string,
  }
}

export class ListNearbyUsersRes extends jspb.Message {
  getNearbyUserIdsList(): Array<number>;
  setNearbyUserIdsList(value: Array<number>): ListNearbyUsersRes;
  clearNearbyUserIdsList(): ListNearbyUsersRes;
  addNearbyUserIds(value: number, index?: number): ListNearbyUsersRes;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListNearbyUsersRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListNearbyUsersRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListNearbyUsersRes): ListNearbyUsersRes.AsObject;
  static serializeBinaryToWriter(message: ListNearbyUsersRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListNearbyUsersRes;
  static deserializeBinaryFromReader(message: ListNearbyUsersRes, reader: jspb.BinaryReader): ListNearbyUsersRes;
}

export namespace ListNearbyUsersRes {
  export type AsObject = {
    nearbyUserIdsList: Array<number>,
    nextPageToken: string,
  }
}

export class ListPlacesReq extends jspb.Message {
  getCommunityId(): number;
  setCommunityId(value: number): ListPlacesReq;

  getPageSize(): number;
  setPageSize(value: number): ListPlacesReq;

  getPageToken(): string;
  setPageToken(value: string): ListPlacesReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListPlacesReq.AsObject;
  static toObject(includeInstance: boolean, msg: ListPlacesReq): ListPlacesReq.AsObject;
  static serializeBinaryToWriter(message: ListPlacesReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListPlacesReq;
  static deserializeBinaryFromReader(message: ListPlacesReq, reader: jspb.BinaryReader): ListPlacesReq;
}

export namespace ListPlacesReq {
  export type AsObject = {
    communityId: number,
    pageSize: number,
    pageToken: string,
  }
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
  static toObject(includeInstance: boolean, msg: ListPlacesRes): ListPlacesRes.AsObject;
  static serializeBinaryToWriter(message: ListPlacesRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListPlacesRes;
  static deserializeBinaryFromReader(message: ListPlacesRes, reader: jspb.BinaryReader): ListPlacesRes;
}

export namespace ListPlacesRes {
  export type AsObject = {
    placesList: Array<pb_pages_pb.Page.AsObject>,
    nextPageToken: string,
  }
}

export class ListGuidesReq extends jspb.Message {
  getCommunityId(): number;
  setCommunityId(value: number): ListGuidesReq;

  getPageSize(): number;
  setPageSize(value: number): ListGuidesReq;

  getPageToken(): string;
  setPageToken(value: string): ListGuidesReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListGuidesReq.AsObject;
  static toObject(includeInstance: boolean, msg: ListGuidesReq): ListGuidesReq.AsObject;
  static serializeBinaryToWriter(message: ListGuidesReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListGuidesReq;
  static deserializeBinaryFromReader(message: ListGuidesReq, reader: jspb.BinaryReader): ListGuidesReq;
}

export namespace ListGuidesReq {
  export type AsObject = {
    communityId: number,
    pageSize: number,
    pageToken: string,
  }
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
  static toObject(includeInstance: boolean, msg: ListGuidesRes): ListGuidesRes.AsObject;
  static serializeBinaryToWriter(message: ListGuidesRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListGuidesRes;
  static deserializeBinaryFromReader(message: ListGuidesRes, reader: jspb.BinaryReader): ListGuidesRes;
}

export namespace ListGuidesRes {
  export type AsObject = {
    guidesList: Array<pb_pages_pb.Page.AsObject>,
    nextPageToken: string,
  }
}

export class ListEventsReq extends jspb.Message {
  getCommunityId(): number;
  setCommunityId(value: number): ListEventsReq;

  getPageSize(): number;
  setPageSize(value: number): ListEventsReq;

  getPageToken(): string;
  setPageToken(value: string): ListEventsReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListEventsReq.AsObject;
  static toObject(includeInstance: boolean, msg: ListEventsReq): ListEventsReq.AsObject;
  static serializeBinaryToWriter(message: ListEventsReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListEventsReq;
  static deserializeBinaryFromReader(message: ListEventsReq, reader: jspb.BinaryReader): ListEventsReq;
}

export namespace ListEventsReq {
  export type AsObject = {
    communityId: number,
    pageSize: number,
    pageToken: string,
  }
}

export class Event extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Event.AsObject;
  static toObject(includeInstance: boolean, msg: Event): Event.AsObject;
  static serializeBinaryToWriter(message: Event, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Event;
  static deserializeBinaryFromReader(message: Event, reader: jspb.BinaryReader): Event;
}

export namespace Event {
  export type AsObject = {
  }
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
  static toObject(includeInstance: boolean, msg: ListEventsRes): ListEventsRes.AsObject;
  static serializeBinaryToWriter(message: ListEventsRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListEventsRes;
  static deserializeBinaryFromReader(message: ListEventsRes, reader: jspb.BinaryReader): ListEventsRes;
}

export namespace ListEventsRes {
  export type AsObject = {
    eventsList: Array<Event.AsObject>,
    nextPageToken: string,
  }
}

export class ListDiscussionsReq extends jspb.Message {
  getCommunityId(): number;
  setCommunityId(value: number): ListDiscussionsReq;

  getPageSize(): number;
  setPageSize(value: number): ListDiscussionsReq;

  getPageToken(): string;
  setPageToken(value: string): ListDiscussionsReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListDiscussionsReq.AsObject;
  static toObject(includeInstance: boolean, msg: ListDiscussionsReq): ListDiscussionsReq.AsObject;
  static serializeBinaryToWriter(message: ListDiscussionsReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListDiscussionsReq;
  static deserializeBinaryFromReader(message: ListDiscussionsReq, reader: jspb.BinaryReader): ListDiscussionsReq;
}

export namespace ListDiscussionsReq {
  export type AsObject = {
    communityId: number,
    pageSize: number,
    pageToken: string,
  }
}

export class ListDiscussionsRes extends jspb.Message {
  getDiscussionsList(): Array<pb_discussions_pb.Discussion>;
  setDiscussionsList(value: Array<pb_discussions_pb.Discussion>): ListDiscussionsRes;
  clearDiscussionsList(): ListDiscussionsRes;
  addDiscussions(value?: pb_discussions_pb.Discussion, index?: number): pb_discussions_pb.Discussion;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListDiscussionsRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListDiscussionsRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListDiscussionsRes): ListDiscussionsRes.AsObject;
  static serializeBinaryToWriter(message: ListDiscussionsRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListDiscussionsRes;
  static deserializeBinaryFromReader(message: ListDiscussionsRes, reader: jspb.BinaryReader): ListDiscussionsRes;
}

export namespace ListDiscussionsRes {
  export type AsObject = {
    discussionsList: Array<pb_discussions_pb.Discussion.AsObject>,
    nextPageToken: string,
  }
}

export class JoinCommunityReq extends jspb.Message {
  getCommunityId(): number;
  setCommunityId(value: number): JoinCommunityReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): JoinCommunityReq.AsObject;
  static toObject(includeInstance: boolean, msg: JoinCommunityReq): JoinCommunityReq.AsObject;
  static serializeBinaryToWriter(message: JoinCommunityReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): JoinCommunityReq;
  static deserializeBinaryFromReader(message: JoinCommunityReq, reader: jspb.BinaryReader): JoinCommunityReq;
}

export namespace JoinCommunityReq {
  export type AsObject = {
    communityId: number,
  }
}

export class LeaveCommunityReq extends jspb.Message {
  getCommunityId(): number;
  setCommunityId(value: number): LeaveCommunityReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LeaveCommunityReq.AsObject;
  static toObject(includeInstance: boolean, msg: LeaveCommunityReq): LeaveCommunityReq.AsObject;
  static serializeBinaryToWriter(message: LeaveCommunityReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LeaveCommunityReq;
  static deserializeBinaryFromReader(message: LeaveCommunityReq, reader: jspb.BinaryReader): LeaveCommunityReq;
}

export namespace LeaveCommunityReq {
  export type AsObject = {
    communityId: number,
  }
}

