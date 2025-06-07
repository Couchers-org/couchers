import * as jspb from 'google-protobuf'

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb'; // proto import: "google/protobuf/timestamp.proto"
import * as annotations_pb from './annotations_pb'; // proto import: "annotations.proto"
import * as api_pb from './api_pb'; // proto import: "api.proto"
import * as communities_pb from './communities_pb'; // proto import: "communities.proto"


export class UserDetails extends jspb.Message {
  getUserId(): number;
  setUserId(value: number): UserDetails;

  getUsername(): string;
  setUsername(value: string): UserDetails;

  getName(): string;
  setName(value: string): UserDetails;

  getEmail(): string;
  setEmail(value: string): UserDetails;

  getGender(): string;
  setGender(value: string): UserDetails;

  getBirthdate(): string;
  setBirthdate(value: string): UserDetails;

  getBanned(): boolean;
  setBanned(value: boolean): UserDetails;

  getDeleted(): boolean;
  setDeleted(value: boolean): UserDetails;

  getDoNotEmail(): boolean;
  setDoNotEmail(value: boolean): UserDetails;

  getBadgesList(): Array<string>;
  setBadgesList(value: Array<string>): UserDetails;
  clearBadgesList(): UserDetails;
  addBadges(value: string, index?: number): UserDetails;

  getHasStrongVerification(): boolean;
  setHasStrongVerification(value: boolean): UserDetails;

  getBirthdateVerificationStatus(): api_pb.BirthdateVerificationStatus;
  setBirthdateVerificationStatus(value: api_pb.BirthdateVerificationStatus): UserDetails;

  getGenderVerificationStatus(): api_pb.GenderVerificationStatus;
  setGenderVerificationStatus(value: api_pb.GenderVerificationStatus): UserDetails;

  getHasPassportSexGenderException(): boolean;
  setHasPassportSexGenderException(value: boolean): UserDetails;

  getAdminNote(): string;
  setAdminNote(value: string): UserDetails;

  getPendingModNotesCount(): number;
  setPendingModNotesCount(value: number): UserDetails;

  getAcknowledgedModNotesCount(): number;
  setAcknowledgedModNotesCount(value: number): UserDetails;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UserDetails.AsObject;
  static toObject(includeInstance: boolean, msg: UserDetails): UserDetails.AsObject;
  static serializeBinaryToWriter(message: UserDetails, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UserDetails;
  static deserializeBinaryFromReader(message: UserDetails, reader: jspb.BinaryReader): UserDetails;
}

export namespace UserDetails {
  export type AsObject = {
    userId: number,
    username: string,
    name: string,
    email: string,
    gender: string,
    birthdate: string,
    banned: boolean,
    deleted: boolean,
    doNotEmail: boolean,
    badgesList: Array<string>,
    hasStrongVerification: boolean,
    birthdateVerificationStatus: api_pb.BirthdateVerificationStatus,
    genderVerificationStatus: api_pb.GenderVerificationStatus,
    hasPassportSexGenderException: boolean,
    adminNote: string,
    pendingModNotesCount: number,
    acknowledgedModNotesCount: number,
  }
}

export class GetUserDetailsReq extends jspb.Message {
  getUser(): string;
  setUser(value: string): GetUserDetailsReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetUserDetailsReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetUserDetailsReq): GetUserDetailsReq.AsObject;
  static serializeBinaryToWriter(message: GetUserDetailsReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetUserDetailsReq;
  static deserializeBinaryFromReader(message: GetUserDetailsReq, reader: jspb.BinaryReader): GetUserDetailsReq;
}

export namespace GetUserDetailsReq {
  export type AsObject = {
    user: string,
  }
}

export class GetUserReq extends jspb.Message {
  getUser(): string;
  setUser(value: string): GetUserReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetUserReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetUserReq): GetUserReq.AsObject;
  static serializeBinaryToWriter(message: GetUserReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetUserReq;
  static deserializeBinaryFromReader(message: GetUserReq, reader: jspb.BinaryReader): GetUserReq;
}

export namespace GetUserReq {
  export type AsObject = {
    user: string,
  }
}

export class ChangeUserGenderReq extends jspb.Message {
  getUser(): string;
  setUser(value: string): ChangeUserGenderReq;

  getGender(): string;
  setGender(value: string): ChangeUserGenderReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChangeUserGenderReq.AsObject;
  static toObject(includeInstance: boolean, msg: ChangeUserGenderReq): ChangeUserGenderReq.AsObject;
  static serializeBinaryToWriter(message: ChangeUserGenderReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ChangeUserGenderReq;
  static deserializeBinaryFromReader(message: ChangeUserGenderReq, reader: jspb.BinaryReader): ChangeUserGenderReq;
}

export namespace ChangeUserGenderReq {
  export type AsObject = {
    user: string,
    gender: string,
  }
}

export class ChangeUserBirthdateReq extends jspb.Message {
  getUser(): string;
  setUser(value: string): ChangeUserBirthdateReq;

  getBirthdate(): string;
  setBirthdate(value: string): ChangeUserBirthdateReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChangeUserBirthdateReq.AsObject;
  static toObject(includeInstance: boolean, msg: ChangeUserBirthdateReq): ChangeUserBirthdateReq.AsObject;
  static serializeBinaryToWriter(message: ChangeUserBirthdateReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ChangeUserBirthdateReq;
  static deserializeBinaryFromReader(message: ChangeUserBirthdateReq, reader: jspb.BinaryReader): ChangeUserBirthdateReq;
}

export namespace ChangeUserBirthdateReq {
  export type AsObject = {
    user: string,
    birthdate: string,
  }
}

export class AddBadgeReq extends jspb.Message {
  getUser(): string;
  setUser(value: string): AddBadgeReq;

  getBadgeId(): string;
  setBadgeId(value: string): AddBadgeReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AddBadgeReq.AsObject;
  static toObject(includeInstance: boolean, msg: AddBadgeReq): AddBadgeReq.AsObject;
  static serializeBinaryToWriter(message: AddBadgeReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AddBadgeReq;
  static deserializeBinaryFromReader(message: AddBadgeReq, reader: jspb.BinaryReader): AddBadgeReq;
}

export namespace AddBadgeReq {
  export type AsObject = {
    user: string,
    badgeId: string,
  }
}

export class RemoveBadgeReq extends jspb.Message {
  getUser(): string;
  setUser(value: string): RemoveBadgeReq;

  getBadgeId(): string;
  setBadgeId(value: string): RemoveBadgeReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RemoveBadgeReq.AsObject;
  static toObject(includeInstance: boolean, msg: RemoveBadgeReq): RemoveBadgeReq.AsObject;
  static serializeBinaryToWriter(message: RemoveBadgeReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RemoveBadgeReq;
  static deserializeBinaryFromReader(message: RemoveBadgeReq, reader: jspb.BinaryReader): RemoveBadgeReq;
}

export namespace RemoveBadgeReq {
  export type AsObject = {
    user: string,
    badgeId: string,
  }
}

export class SetPassportSexGenderExceptionReq extends jspb.Message {
  getUser(): string;
  setUser(value: string): SetPassportSexGenderExceptionReq;

  getPassportSexGenderException(): boolean;
  setPassportSexGenderException(value: boolean): SetPassportSexGenderExceptionReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SetPassportSexGenderExceptionReq.AsObject;
  static toObject(includeInstance: boolean, msg: SetPassportSexGenderExceptionReq): SetPassportSexGenderExceptionReq.AsObject;
  static serializeBinaryToWriter(message: SetPassportSexGenderExceptionReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SetPassportSexGenderExceptionReq;
  static deserializeBinaryFromReader(message: SetPassportSexGenderExceptionReq, reader: jspb.BinaryReader): SetPassportSexGenderExceptionReq;
}

export namespace SetPassportSexGenderExceptionReq {
  export type AsObject = {
    user: string,
    passportSexGenderException: boolean,
  }
}

export class BanUserReq extends jspb.Message {
  getUser(): string;
  setUser(value: string): BanUserReq;

  getAdminNote(): string;
  setAdminNote(value: string): BanUserReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): BanUserReq.AsObject;
  static toObject(includeInstance: boolean, msg: BanUserReq): BanUserReq.AsObject;
  static serializeBinaryToWriter(message: BanUserReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): BanUserReq;
  static deserializeBinaryFromReader(message: BanUserReq, reader: jspb.BinaryReader): BanUserReq;
}

export namespace BanUserReq {
  export type AsObject = {
    user: string,
    adminNote: string,
  }
}

export class UnbanUserReq extends jspb.Message {
  getUser(): string;
  setUser(value: string): UnbanUserReq;

  getAdminNote(): string;
  setAdminNote(value: string): UnbanUserReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UnbanUserReq.AsObject;
  static toObject(includeInstance: boolean, msg: UnbanUserReq): UnbanUserReq.AsObject;
  static serializeBinaryToWriter(message: UnbanUserReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UnbanUserReq;
  static deserializeBinaryFromReader(message: UnbanUserReq, reader: jspb.BinaryReader): UnbanUserReq;
}

export namespace UnbanUserReq {
  export type AsObject = {
    user: string,
    adminNote: string,
  }
}

export class AddAdminNoteReq extends jspb.Message {
  getUser(): string;
  setUser(value: string): AddAdminNoteReq;

  getAdminNote(): string;
  setAdminNote(value: string): AddAdminNoteReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AddAdminNoteReq.AsObject;
  static toObject(includeInstance: boolean, msg: AddAdminNoteReq): AddAdminNoteReq.AsObject;
  static serializeBinaryToWriter(message: AddAdminNoteReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AddAdminNoteReq;
  static deserializeBinaryFromReader(message: AddAdminNoteReq, reader: jspb.BinaryReader): AddAdminNoteReq;
}

export namespace AddAdminNoteReq {
  export type AsObject = {
    user: string,
    adminNote: string,
  }
}

export class ContentReport extends jspb.Message {
  getContentReportId(): number;
  setContentReportId(value: number): ContentReport;

  getTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setTime(value?: google_protobuf_timestamp_pb.Timestamp): ContentReport;
  hasTime(): boolean;
  clearTime(): ContentReport;

  getReportingUserId(): number;
  setReportingUserId(value: number): ContentReport;

  getAuthorUserId(): number;
  setAuthorUserId(value: number): ContentReport;

  getReason(): string;
  setReason(value: string): ContentReport;

  getDescription(): string;
  setDescription(value: string): ContentReport;

  getContentRef(): string;
  setContentRef(value: string): ContentReport;

  getUserAgent(): string;
  setUserAgent(value: string): ContentReport;

  getPage(): string;
  setPage(value: string): ContentReport;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ContentReport.AsObject;
  static toObject(includeInstance: boolean, msg: ContentReport): ContentReport.AsObject;
  static serializeBinaryToWriter(message: ContentReport, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ContentReport;
  static deserializeBinaryFromReader(message: ContentReport, reader: jspb.BinaryReader): ContentReport;
}

export namespace ContentReport {
  export type AsObject = {
    contentReportId: number,
    time?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    reportingUserId: number,
    authorUserId: number,
    reason: string,
    description: string,
    contentRef: string,
    userAgent: string,
    page: string,
  }
}

export class GetContentReportReq extends jspb.Message {
  getContentReportId(): number;
  setContentReportId(value: number): GetContentReportReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetContentReportReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetContentReportReq): GetContentReportReq.AsObject;
  static serializeBinaryToWriter(message: GetContentReportReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetContentReportReq;
  static deserializeBinaryFromReader(message: GetContentReportReq, reader: jspb.BinaryReader): GetContentReportReq;
}

export namespace GetContentReportReq {
  export type AsObject = {
    contentReportId: number,
  }
}

export class GetContentReportRes extends jspb.Message {
  getContentReport(): ContentReport | undefined;
  setContentReport(value?: ContentReport): GetContentReportRes;
  hasContentReport(): boolean;
  clearContentReport(): GetContentReportRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetContentReportRes.AsObject;
  static toObject(includeInstance: boolean, msg: GetContentReportRes): GetContentReportRes.AsObject;
  static serializeBinaryToWriter(message: GetContentReportRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetContentReportRes;
  static deserializeBinaryFromReader(message: GetContentReportRes, reader: jspb.BinaryReader): GetContentReportRes;
}

export namespace GetContentReportRes {
  export type AsObject = {
    contentReport?: ContentReport.AsObject,
  }
}

export class GetContentReportsForAuthorReq extends jspb.Message {
  getUser(): string;
  setUser(value: string): GetContentReportsForAuthorReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetContentReportsForAuthorReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetContentReportsForAuthorReq): GetContentReportsForAuthorReq.AsObject;
  static serializeBinaryToWriter(message: GetContentReportsForAuthorReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetContentReportsForAuthorReq;
  static deserializeBinaryFromReader(message: GetContentReportsForAuthorReq, reader: jspb.BinaryReader): GetContentReportsForAuthorReq;
}

export namespace GetContentReportsForAuthorReq {
  export type AsObject = {
    user: string,
  }
}

export class GetContentReportsForAuthorRes extends jspb.Message {
  getContentReportsList(): Array<ContentReport>;
  setContentReportsList(value: Array<ContentReport>): GetContentReportsForAuthorRes;
  clearContentReportsList(): GetContentReportsForAuthorRes;
  addContentReports(value?: ContentReport, index?: number): ContentReport;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetContentReportsForAuthorRes.AsObject;
  static toObject(includeInstance: boolean, msg: GetContentReportsForAuthorRes): GetContentReportsForAuthorRes.AsObject;
  static serializeBinaryToWriter(message: GetContentReportsForAuthorRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetContentReportsForAuthorRes;
  static deserializeBinaryFromReader(message: GetContentReportsForAuthorRes, reader: jspb.BinaryReader): GetContentReportsForAuthorRes;
}

export namespace GetContentReportsForAuthorRes {
  export type AsObject = {
    contentReportsList: Array<ContentReport.AsObject>,
  }
}

export class SendModNoteReq extends jspb.Message {
  getUser(): string;
  setUser(value: string): SendModNoteReq;

  getContent(): string;
  setContent(value: string): SendModNoteReq;

  getInternalId(): string;
  setInternalId(value: string): SendModNoteReq;

  getDoNotNotify(): boolean;
  setDoNotNotify(value: boolean): SendModNoteReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SendModNoteReq.AsObject;
  static toObject(includeInstance: boolean, msg: SendModNoteReq): SendModNoteReq.AsObject;
  static serializeBinaryToWriter(message: SendModNoteReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SendModNoteReq;
  static deserializeBinaryFromReader(message: SendModNoteReq, reader: jspb.BinaryReader): SendModNoteReq;
}

export namespace SendModNoteReq {
  export type AsObject = {
    user: string,
    content: string,
    internalId: string,
    doNotNotify: boolean,
  }
}

export class MarkUserNeedsLocationUpdateReq extends jspb.Message {
  getUser(): string;
  setUser(value: string): MarkUserNeedsLocationUpdateReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MarkUserNeedsLocationUpdateReq.AsObject;
  static toObject(includeInstance: boolean, msg: MarkUserNeedsLocationUpdateReq): MarkUserNeedsLocationUpdateReq.AsObject;
  static serializeBinaryToWriter(message: MarkUserNeedsLocationUpdateReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MarkUserNeedsLocationUpdateReq;
  static deserializeBinaryFromReader(message: MarkUserNeedsLocationUpdateReq, reader: jspb.BinaryReader): MarkUserNeedsLocationUpdateReq;
}

export namespace MarkUserNeedsLocationUpdateReq {
  export type AsObject = {
    user: string,
  }
}

export class DeleteUserReq extends jspb.Message {
  getUser(): string;
  setUser(value: string): DeleteUserReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteUserReq.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteUserReq): DeleteUserReq.AsObject;
  static serializeBinaryToWriter(message: DeleteUserReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteUserReq;
  static deserializeBinaryFromReader(message: DeleteUserReq, reader: jspb.BinaryReader): DeleteUserReq;
}

export namespace DeleteUserReq {
  export type AsObject = {
    user: string,
  }
}

export class RecoverDeletedUserReq extends jspb.Message {
  getUser(): string;
  setUser(value: string): RecoverDeletedUserReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RecoverDeletedUserReq.AsObject;
  static toObject(includeInstance: boolean, msg: RecoverDeletedUserReq): RecoverDeletedUserReq.AsObject;
  static serializeBinaryToWriter(message: RecoverDeletedUserReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RecoverDeletedUserReq;
  static deserializeBinaryFromReader(message: RecoverDeletedUserReq, reader: jspb.BinaryReader): RecoverDeletedUserReq;
}

export namespace RecoverDeletedUserReq {
  export type AsObject = {
    user: string,
  }
}

export class CreateApiKeyReq extends jspb.Message {
  getUser(): string;
  setUser(value: string): CreateApiKeyReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateApiKeyReq.AsObject;
  static toObject(includeInstance: boolean, msg: CreateApiKeyReq): CreateApiKeyReq.AsObject;
  static serializeBinaryToWriter(message: CreateApiKeyReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateApiKeyReq;
  static deserializeBinaryFromReader(message: CreateApiKeyReq, reader: jspb.BinaryReader): CreateApiKeyReq;
}

export namespace CreateApiKeyReq {
  export type AsObject = {
    user: string,
  }
}

export class CreateApiKeyRes extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateApiKeyRes.AsObject;
  static toObject(includeInstance: boolean, msg: CreateApiKeyRes): CreateApiKeyRes.AsObject;
  static serializeBinaryToWriter(message: CreateApiKeyRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateApiKeyRes;
  static deserializeBinaryFromReader(message: CreateApiKeyRes, reader: jspb.BinaryReader): CreateApiKeyRes;
}

export namespace CreateApiKeyRes {
  export type AsObject = {
  }
}

export class CreateCommunityReq extends jspb.Message {
  getName(): string;
  setName(value: string): CreateCommunityReq;

  getDescription(): string;
  setDescription(value: string): CreateCommunityReq;

  getParentNodeId(): number;
  setParentNodeId(value: number): CreateCommunityReq;

  getAdminIdsList(): Array<number>;
  setAdminIdsList(value: Array<number>): CreateCommunityReq;
  clearAdminIdsList(): CreateCommunityReq;
  addAdminIds(value: number, index?: number): CreateCommunityReq;

  getGeojson(): string;
  setGeojson(value: string): CreateCommunityReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateCommunityReq.AsObject;
  static toObject(includeInstance: boolean, msg: CreateCommunityReq): CreateCommunityReq.AsObject;
  static serializeBinaryToWriter(message: CreateCommunityReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateCommunityReq;
  static deserializeBinaryFromReader(message: CreateCommunityReq, reader: jspb.BinaryReader): CreateCommunityReq;
}

export namespace CreateCommunityReq {
  export type AsObject = {
    name: string,
    description: string,
    parentNodeId: number,
    adminIdsList: Array<number>,
    geojson: string,
  }
}

export class UpdateCommunityReq extends jspb.Message {
  getCommunityId(): number;
  setCommunityId(value: number): UpdateCommunityReq;

  getName(): string;
  setName(value: string): UpdateCommunityReq;

  getDescription(): string;
  setDescription(value: string): UpdateCommunityReq;

  getParentNodeId(): number;
  setParentNodeId(value: number): UpdateCommunityReq;

  getGeojson(): string;
  setGeojson(value: string): UpdateCommunityReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateCommunityReq.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateCommunityReq): UpdateCommunityReq.AsObject;
  static serializeBinaryToWriter(message: UpdateCommunityReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateCommunityReq;
  static deserializeBinaryFromReader(message: UpdateCommunityReq, reader: jspb.BinaryReader): UpdateCommunityReq;
}

export namespace UpdateCommunityReq {
  export type AsObject = {
    communityId: number,
    name: string,
    description: string,
    parentNodeId: number,
    geojson: string,
  }
}

export class GetChatsReq extends jspb.Message {
  getUser(): string;
  setUser(value: string): GetChatsReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetChatsReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetChatsReq): GetChatsReq.AsObject;
  static serializeBinaryToWriter(message: GetChatsReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetChatsReq;
  static deserializeBinaryFromReader(message: GetChatsReq, reader: jspb.BinaryReader): GetChatsReq;
}

export namespace GetChatsReq {
  export type AsObject = {
    user: string,
  }
}

export class GetChatsRes extends jspb.Message {
  getResponse(): string;
  setResponse(value: string): GetChatsRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetChatsRes.AsObject;
  static toObject(includeInstance: boolean, msg: GetChatsRes): GetChatsRes.AsObject;
  static serializeBinaryToWriter(message: GetChatsRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetChatsRes;
  static deserializeBinaryFromReader(message: GetChatsRes, reader: jspb.BinaryReader): GetChatsRes;
}

export namespace GetChatsRes {
  export type AsObject = {
    response: string,
  }
}

export class ListEventCommunityInviteRequestsReq extends jspb.Message {
  getPageSize(): number;
  setPageSize(value: number): ListEventCommunityInviteRequestsReq;

  getPageToken(): string;
  setPageToken(value: string): ListEventCommunityInviteRequestsReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListEventCommunityInviteRequestsReq.AsObject;
  static toObject(includeInstance: boolean, msg: ListEventCommunityInviteRequestsReq): ListEventCommunityInviteRequestsReq.AsObject;
  static serializeBinaryToWriter(message: ListEventCommunityInviteRequestsReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListEventCommunityInviteRequestsReq;
  static deserializeBinaryFromReader(message: ListEventCommunityInviteRequestsReq, reader: jspb.BinaryReader): ListEventCommunityInviteRequestsReq;
}

export namespace ListEventCommunityInviteRequestsReq {
  export type AsObject = {
    pageSize: number,
    pageToken: string,
  }
}

export class EventCommunityInviteRequest extends jspb.Message {
  getEventCommunityInviteRequestId(): number;
  setEventCommunityInviteRequestId(value: number): EventCommunityInviteRequest;

  getUserId(): number;
  setUserId(value: number): EventCommunityInviteRequest;

  getEventUrl(): string;
  setEventUrl(value: string): EventCommunityInviteRequest;

  getApproxUsersToNotify(): number;
  setApproxUsersToNotify(value: number): EventCommunityInviteRequest;

  getCommunityId(): number;
  setCommunityId(value: number): EventCommunityInviteRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EventCommunityInviteRequest.AsObject;
  static toObject(includeInstance: boolean, msg: EventCommunityInviteRequest): EventCommunityInviteRequest.AsObject;
  static serializeBinaryToWriter(message: EventCommunityInviteRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EventCommunityInviteRequest;
  static deserializeBinaryFromReader(message: EventCommunityInviteRequest, reader: jspb.BinaryReader): EventCommunityInviteRequest;
}

export namespace EventCommunityInviteRequest {
  export type AsObject = {
    eventCommunityInviteRequestId: number,
    userId: number,
    eventUrl: string,
    approxUsersToNotify: number,
    communityId: number,
  }
}

export class ListEventCommunityInviteRequestsRes extends jspb.Message {
  getRequestsList(): Array<EventCommunityInviteRequest>;
  setRequestsList(value: Array<EventCommunityInviteRequest>): ListEventCommunityInviteRequestsRes;
  clearRequestsList(): ListEventCommunityInviteRequestsRes;
  addRequests(value?: EventCommunityInviteRequest, index?: number): EventCommunityInviteRequest;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListEventCommunityInviteRequestsRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListEventCommunityInviteRequestsRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListEventCommunityInviteRequestsRes): ListEventCommunityInviteRequestsRes.AsObject;
  static serializeBinaryToWriter(message: ListEventCommunityInviteRequestsRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListEventCommunityInviteRequestsRes;
  static deserializeBinaryFromReader(message: ListEventCommunityInviteRequestsRes, reader: jspb.BinaryReader): ListEventCommunityInviteRequestsRes;
}

export namespace ListEventCommunityInviteRequestsRes {
  export type AsObject = {
    requestsList: Array<EventCommunityInviteRequest.AsObject>,
    nextPageToken: string,
  }
}

export class DecideEventCommunityInviteRequestReq extends jspb.Message {
  getEventCommunityInviteRequestId(): number;
  setEventCommunityInviteRequestId(value: number): DecideEventCommunityInviteRequestReq;

  getApprove(): boolean;
  setApprove(value: boolean): DecideEventCommunityInviteRequestReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DecideEventCommunityInviteRequestReq.AsObject;
  static toObject(includeInstance: boolean, msg: DecideEventCommunityInviteRequestReq): DecideEventCommunityInviteRequestReq.AsObject;
  static serializeBinaryToWriter(message: DecideEventCommunityInviteRequestReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DecideEventCommunityInviteRequestReq;
  static deserializeBinaryFromReader(message: DecideEventCommunityInviteRequestReq, reader: jspb.BinaryReader): DecideEventCommunityInviteRequestReq;
}

export namespace DecideEventCommunityInviteRequestReq {
  export type AsObject = {
    eventCommunityInviteRequestId: number,
    approve: boolean,
  }
}

export class DecideEventCommunityInviteRequestRes extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DecideEventCommunityInviteRequestRes.AsObject;
  static toObject(includeInstance: boolean, msg: DecideEventCommunityInviteRequestRes): DecideEventCommunityInviteRequestRes.AsObject;
  static serializeBinaryToWriter(message: DecideEventCommunityInviteRequestRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DecideEventCommunityInviteRequestRes;
  static deserializeBinaryFromReader(message: DecideEventCommunityInviteRequestRes, reader: jspb.BinaryReader): DecideEventCommunityInviteRequestRes;
}

export namespace DecideEventCommunityInviteRequestRes {
  export type AsObject = {
  }
}

export class DeleteEventReq extends jspb.Message {
  getEventId(): number;
  setEventId(value: number): DeleteEventReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteEventReq.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteEventReq): DeleteEventReq.AsObject;
  static serializeBinaryToWriter(message: DeleteEventReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteEventReq;
  static deserializeBinaryFromReader(message: DeleteEventReq, reader: jspb.BinaryReader): DeleteEventReq;
}

export namespace DeleteEventReq {
  export type AsObject = {
    eventId: number,
  }
}

export class ListUserIdsReq extends jspb.Message {
  getStartTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setStartTime(value?: google_protobuf_timestamp_pb.Timestamp): ListUserIdsReq;
  hasStartTime(): boolean;
  clearStartTime(): ListUserIdsReq;

  getEndTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setEndTime(value?: google_protobuf_timestamp_pb.Timestamp): ListUserIdsReq;
  hasEndTime(): boolean;
  clearEndTime(): ListUserIdsReq;

  getPageSize(): number;
  setPageSize(value: number): ListUserIdsReq;

  getPageToken(): string;
  setPageToken(value: string): ListUserIdsReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListUserIdsReq.AsObject;
  static toObject(includeInstance: boolean, msg: ListUserIdsReq): ListUserIdsReq.AsObject;
  static serializeBinaryToWriter(message: ListUserIdsReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListUserIdsReq;
  static deserializeBinaryFromReader(message: ListUserIdsReq, reader: jspb.BinaryReader): ListUserIdsReq;
}

export namespace ListUserIdsReq {
  export type AsObject = {
    startTime?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    endTime?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    pageSize: number,
    pageToken: string,
  }
}

export class ListUserIdsRes extends jspb.Message {
  getUserIdsList(): Array<number>;
  setUserIdsList(value: Array<number>): ListUserIdsRes;
  clearUserIdsList(): ListUserIdsRes;
  addUserIds(value: number, index?: number): ListUserIdsRes;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListUserIdsRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListUserIdsRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListUserIdsRes): ListUserIdsRes.AsObject;
  static serializeBinaryToWriter(message: ListUserIdsRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListUserIdsRes;
  static deserializeBinaryFromReader(message: ListUserIdsRes, reader: jspb.BinaryReader): ListUserIdsRes;
}

export namespace ListUserIdsRes {
  export type AsObject = {
    userIdsList: Array<number>,
    nextPageToken: string,
  }
}

export class EditReferenceTextReq extends jspb.Message {
  getReferenceId(): number;
  setReferenceId(value: number): EditReferenceTextReq;

  getNewText(): string;
  setNewText(value: string): EditReferenceTextReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EditReferenceTextReq.AsObject;
  static toObject(includeInstance: boolean, msg: EditReferenceTextReq): EditReferenceTextReq.AsObject;
  static serializeBinaryToWriter(message: EditReferenceTextReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EditReferenceTextReq;
  static deserializeBinaryFromReader(message: EditReferenceTextReq, reader: jspb.BinaryReader): EditReferenceTextReq;
}

export namespace EditReferenceTextReq {
  export type AsObject = {
    referenceId: number,
    newText: string,
  }
}

export class DeleteReferenceReq extends jspb.Message {
  getReferenceId(): number;
  setReferenceId(value: number): DeleteReferenceReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteReferenceReq.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteReferenceReq): DeleteReferenceReq.AsObject;
  static serializeBinaryToWriter(message: DeleteReferenceReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteReferenceReq;
  static deserializeBinaryFromReader(message: DeleteReferenceReq, reader: jspb.BinaryReader): DeleteReferenceReq;
}

export namespace DeleteReferenceReq {
  export type AsObject = {
    referenceId: number,
  }
}

export class EditDiscussionReq extends jspb.Message {
  getDiscussionId(): number;
  setDiscussionId(value: number): EditDiscussionReq;

  getNewTitle(): string;
  setNewTitle(value: string): EditDiscussionReq;

  getNewContent(): string;
  setNewContent(value: string): EditDiscussionReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EditDiscussionReq.AsObject;
  static toObject(includeInstance: boolean, msg: EditDiscussionReq): EditDiscussionReq.AsObject;
  static serializeBinaryToWriter(message: EditDiscussionReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EditDiscussionReq;
  static deserializeBinaryFromReader(message: EditDiscussionReq, reader: jspb.BinaryReader): EditDiscussionReq;
}

export namespace EditDiscussionReq {
  export type AsObject = {
    discussionId: number,
    newTitle: string,
    newContent: string,
  }
}

export class EditReplyReq extends jspb.Message {
  getReplyId(): number;
  setReplyId(value: number): EditReplyReq;

  getNewContent(): string;
  setNewContent(value: string): EditReplyReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EditReplyReq.AsObject;
  static toObject(includeInstance: boolean, msg: EditReplyReq): EditReplyReq.AsObject;
  static serializeBinaryToWriter(message: EditReplyReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EditReplyReq;
  static deserializeBinaryFromReader(message: EditReplyReq, reader: jspb.BinaryReader): EditReplyReq;
}

export namespace EditReplyReq {
  export type AsObject = {
    replyId: number,
    newContent: string,
  }
}

export class CreateAccountDeletionLinkReq extends jspb.Message {
  getUser(): string;
  setUser(value: string): CreateAccountDeletionLinkReq;

  getExpiryDays(): number;
  setExpiryDays(value: number): CreateAccountDeletionLinkReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateAccountDeletionLinkReq.AsObject;
  static toObject(includeInstance: boolean, msg: CreateAccountDeletionLinkReq): CreateAccountDeletionLinkReq.AsObject;
  static serializeBinaryToWriter(message: CreateAccountDeletionLinkReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateAccountDeletionLinkReq;
  static deserializeBinaryFromReader(message: CreateAccountDeletionLinkReq, reader: jspb.BinaryReader): CreateAccountDeletionLinkReq;
}

export namespace CreateAccountDeletionLinkReq {
  export type AsObject = {
    user: string,
    expiryDays: number,
  }
}

export class CreateAccountDeletionLinkRes extends jspb.Message {
  getAccountDeletionConfirmUrl(): string;
  setAccountDeletionConfirmUrl(value: string): CreateAccountDeletionLinkRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateAccountDeletionLinkRes.AsObject;
  static toObject(includeInstance: boolean, msg: CreateAccountDeletionLinkRes): CreateAccountDeletionLinkRes.AsObject;
  static serializeBinaryToWriter(message: CreateAccountDeletionLinkRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateAccountDeletionLinkRes;
  static deserializeBinaryFromReader(message: CreateAccountDeletionLinkRes, reader: jspb.BinaryReader): CreateAccountDeletionLinkRes;
}

export namespace CreateAccountDeletionLinkRes {
  export type AsObject = {
    accountDeletionConfirmUrl: string,
  }
}

export class AccessStatsReq extends jspb.Message {
  getUser(): string;
  setUser(value: string): AccessStatsReq;

  getStartTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setStartTime(value?: google_protobuf_timestamp_pb.Timestamp): AccessStatsReq;
  hasStartTime(): boolean;
  clearStartTime(): AccessStatsReq;

  getEndTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setEndTime(value?: google_protobuf_timestamp_pb.Timestamp): AccessStatsReq;
  hasEndTime(): boolean;
  clearEndTime(): AccessStatsReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AccessStatsReq.AsObject;
  static toObject(includeInstance: boolean, msg: AccessStatsReq): AccessStatsReq.AsObject;
  static serializeBinaryToWriter(message: AccessStatsReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AccessStatsReq;
  static deserializeBinaryFromReader(message: AccessStatsReq, reader: jspb.BinaryReader): AccessStatsReq;
}

export namespace AccessStatsReq {
  export type AsObject = {
    user: string,
    startTime?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    endTime?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class AccessStat extends jspb.Message {
  getIpAddress(): string;
  setIpAddress(value: string): AccessStat;

  getAsn(): string;
  setAsn(value: string): AccessStat;

  getAsorg(): string;
  setAsorg(value: string): AccessStat;

  getAsnetwork(): string;
  setAsnetwork(value: string): AccessStat;

  getUserAgent(): string;
  setUserAgent(value: string): AccessStat;

  getOperatingSystem(): string;
  setOperatingSystem(value: string): AccessStat;

  getBrowser(): string;
  setBrowser(value: string): AccessStat;

  getDevice(): string;
  setDevice(value: string): AccessStat;

  getApproximateLocation(): string;
  setApproximateLocation(value: string): AccessStat;

  getApiCallCount(): number;
  setApiCallCount(value: number): AccessStat;

  getPeriodsCount(): number;
  setPeriodsCount(value: number): AccessStat;

  getFirstSeen(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setFirstSeen(value?: google_protobuf_timestamp_pb.Timestamp): AccessStat;
  hasFirstSeen(): boolean;
  clearFirstSeen(): AccessStat;

  getLastSeen(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setLastSeen(value?: google_protobuf_timestamp_pb.Timestamp): AccessStat;
  hasLastSeen(): boolean;
  clearLastSeen(): AccessStat;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AccessStat.AsObject;
  static toObject(includeInstance: boolean, msg: AccessStat): AccessStat.AsObject;
  static serializeBinaryToWriter(message: AccessStat, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AccessStat;
  static deserializeBinaryFromReader(message: AccessStat, reader: jspb.BinaryReader): AccessStat;
}

export namespace AccessStat {
  export type AsObject = {
    ipAddress: string,
    asn: string,
    asorg: string,
    asnetwork: string,
    userAgent: string,
    operatingSystem: string,
    browser: string,
    device: string,
    approximateLocation: string,
    apiCallCount: number,
    periodsCount: number,
    firstSeen?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    lastSeen?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class AccessStatsRes extends jspb.Message {
  getStatsList(): Array<AccessStat>;
  setStatsList(value: Array<AccessStat>): AccessStatsRes;
  clearStatsList(): AccessStatsRes;
  addStats(value?: AccessStat, index?: number): AccessStat;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AccessStatsRes.AsObject;
  static toObject(includeInstance: boolean, msg: AccessStatsRes): AccessStatsRes.AsObject;
  static serializeBinaryToWriter(message: AccessStatsRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AccessStatsRes;
  static deserializeBinaryFromReader(message: AccessStatsRes, reader: jspb.BinaryReader): AccessStatsRes;
}

export namespace AccessStatsRes {
  export type AsObject = {
    statsList: Array<AccessStat.AsObject>,
  }
}

export class SendBlogPostNotificationReq extends jspb.Message {
  getUrl(): string;
  setUrl(value: string): SendBlogPostNotificationReq;

  getTitle(): string;
  setTitle(value: string): SendBlogPostNotificationReq;

  getBlurb(): string;
  setBlurb(value: string): SendBlogPostNotificationReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SendBlogPostNotificationReq.AsObject;
  static toObject(includeInstance: boolean, msg: SendBlogPostNotificationReq): SendBlogPostNotificationReq.AsObject;
  static serializeBinaryToWriter(message: SendBlogPostNotificationReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SendBlogPostNotificationReq;
  static deserializeBinaryFromReader(message: SendBlogPostNotificationReq, reader: jspb.BinaryReader): SendBlogPostNotificationReq;
}

export namespace SendBlogPostNotificationReq {
  export type AsObject = {
    url: string,
    title: string,
    blurb: string,
  }
}

