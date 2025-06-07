import * as jspb from 'google-protobuf'

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb'; // proto import: "google/protobuf/timestamp.proto"
import * as annotations_pb from './annotations_pb'; // proto import: "annotations.proto"
import * as api_pb from './api_pb'; // proto import: "api.proto"
import * as auth_pb from './auth_pb'; // proto import: "auth.proto"


export class GetAccountInfoRes extends jspb.Message {
  getUsername(): string;
  setUsername(value: string): GetAccountInfoRes;

  getEmail(): string;
  setEmail(value: string): GetAccountInfoRes;

  getProfileComplete(): boolean;
  setProfileComplete(value: boolean): GetAccountInfoRes;

  getPhone(): string;
  setPhone(value: string): GetAccountInfoRes;

  getPhoneVerified(): boolean;
  setPhoneVerified(value: boolean): GetAccountInfoRes;

  getTimezone(): string;
  setTimezone(value: string): GetAccountInfoRes;

  getHasDonated(): boolean;
  setHasDonated(value: boolean): GetAccountInfoRes;

  getHasStrongVerification(): boolean;
  setHasStrongVerification(value: boolean): GetAccountInfoRes;

  getBirthdateVerificationStatus(): api_pb.BirthdateVerificationStatus;
  setBirthdateVerificationStatus(value: api_pb.BirthdateVerificationStatus): GetAccountInfoRes;

  getGenderVerificationStatus(): api_pb.GenderVerificationStatus;
  setGenderVerificationStatus(value: api_pb.GenderVerificationStatus): GetAccountInfoRes;

  getDoNotEmail(): boolean;
  setDoNotEmail(value: boolean): GetAccountInfoRes;

  getIsSuperuser(): boolean;
  setIsSuperuser(value: boolean): GetAccountInfoRes;

  getUiLanguagePreference(): string;
  setUiLanguagePreference(value: string): GetAccountInfoRes;

  getProfilePublicVisibility(): ProfilePublicVisibility;
  setProfilePublicVisibility(value: ProfilePublicVisibility): GetAccountInfoRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetAccountInfoRes.AsObject;
  static toObject(includeInstance: boolean, msg: GetAccountInfoRes): GetAccountInfoRes.AsObject;
  static serializeBinaryToWriter(message: GetAccountInfoRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetAccountInfoRes;
  static deserializeBinaryFromReader(message: GetAccountInfoRes, reader: jspb.BinaryReader): GetAccountInfoRes;
}

export namespace GetAccountInfoRes {
  export type AsObject = {
    username: string,
    email: string,
    profileComplete: boolean,
    phone: string,
    phoneVerified: boolean,
    timezone: string,
    hasDonated: boolean,
    hasStrongVerification: boolean,
    birthdateVerificationStatus: api_pb.BirthdateVerificationStatus,
    genderVerificationStatus: api_pb.GenderVerificationStatus,
    doNotEmail: boolean,
    isSuperuser: boolean,
    uiLanguagePreference: string,
    profilePublicVisibility: ProfilePublicVisibility,
  }
}

export class ChangePasswordV2Req extends jspb.Message {
  getOldPassword(): string;
  setOldPassword(value: string): ChangePasswordV2Req;

  getNewPassword(): string;
  setNewPassword(value: string): ChangePasswordV2Req;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChangePasswordV2Req.AsObject;
  static toObject(includeInstance: boolean, msg: ChangePasswordV2Req): ChangePasswordV2Req.AsObject;
  static serializeBinaryToWriter(message: ChangePasswordV2Req, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ChangePasswordV2Req;
  static deserializeBinaryFromReader(message: ChangePasswordV2Req, reader: jspb.BinaryReader): ChangePasswordV2Req;
}

export namespace ChangePasswordV2Req {
  export type AsObject = {
    oldPassword: string,
    newPassword: string,
  }
}

export class ChangeEmailV2Req extends jspb.Message {
  getPassword(): string;
  setPassword(value: string): ChangeEmailV2Req;

  getNewEmail(): string;
  setNewEmail(value: string): ChangeEmailV2Req;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChangeEmailV2Req.AsObject;
  static toObject(includeInstance: boolean, msg: ChangeEmailV2Req): ChangeEmailV2Req.AsObject;
  static serializeBinaryToWriter(message: ChangeEmailV2Req, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ChangeEmailV2Req;
  static deserializeBinaryFromReader(message: ChangeEmailV2Req, reader: jspb.BinaryReader): ChangeEmailV2Req;
}

export namespace ChangeEmailV2Req {
  export type AsObject = {
    password: string,
    newEmail: string,
  }
}

export class ChangeLanguagePreferenceReq extends jspb.Message {
  getUiLanguagePreference(): string;
  setUiLanguagePreference(value: string): ChangeLanguagePreferenceReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChangeLanguagePreferenceReq.AsObject;
  static toObject(includeInstance: boolean, msg: ChangeLanguagePreferenceReq): ChangeLanguagePreferenceReq.AsObject;
  static serializeBinaryToWriter(message: ChangeLanguagePreferenceReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ChangeLanguagePreferenceReq;
  static deserializeBinaryFromReader(message: ChangeLanguagePreferenceReq, reader: jspb.BinaryReader): ChangeLanguagePreferenceReq;
}

export namespace ChangeLanguagePreferenceReq {
  export type AsObject = {
    uiLanguagePreference: string,
  }
}

export class GetContributorFormInfoRes extends jspb.Message {
  getFilledContributorForm(): boolean;
  setFilledContributorForm(value: boolean): GetContributorFormInfoRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetContributorFormInfoRes.AsObject;
  static toObject(includeInstance: boolean, msg: GetContributorFormInfoRes): GetContributorFormInfoRes.AsObject;
  static serializeBinaryToWriter(message: GetContributorFormInfoRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetContributorFormInfoRes;
  static deserializeBinaryFromReader(message: GetContributorFormInfoRes, reader: jspb.BinaryReader): GetContributorFormInfoRes;
}

export namespace GetContributorFormInfoRes {
  export type AsObject = {
    filledContributorForm: boolean,
  }
}

export class FillContributorFormReq extends jspb.Message {
  getContributorForm(): auth_pb.ContributorForm | undefined;
  setContributorForm(value?: auth_pb.ContributorForm): FillContributorFormReq;
  hasContributorForm(): boolean;
  clearContributorForm(): FillContributorFormReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FillContributorFormReq.AsObject;
  static toObject(includeInstance: boolean, msg: FillContributorFormReq): FillContributorFormReq.AsObject;
  static serializeBinaryToWriter(message: FillContributorFormReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FillContributorFormReq;
  static deserializeBinaryFromReader(message: FillContributorFormReq, reader: jspb.BinaryReader): FillContributorFormReq;
}

export namespace FillContributorFormReq {
  export type AsObject = {
    contributorForm?: auth_pb.ContributorForm.AsObject,
  }
}

export class ChangePhoneReq extends jspb.Message {
  getPhone(): string;
  setPhone(value: string): ChangePhoneReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChangePhoneReq.AsObject;
  static toObject(includeInstance: boolean, msg: ChangePhoneReq): ChangePhoneReq.AsObject;
  static serializeBinaryToWriter(message: ChangePhoneReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ChangePhoneReq;
  static deserializeBinaryFromReader(message: ChangePhoneReq, reader: jspb.BinaryReader): ChangePhoneReq;
}

export namespace ChangePhoneReq {
  export type AsObject = {
    phone: string,
  }
}

export class VerifyPhoneReq extends jspb.Message {
  getToken(): string;
  setToken(value: string): VerifyPhoneReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VerifyPhoneReq.AsObject;
  static toObject(includeInstance: boolean, msg: VerifyPhoneReq): VerifyPhoneReq.AsObject;
  static serializeBinaryToWriter(message: VerifyPhoneReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VerifyPhoneReq;
  static deserializeBinaryFromReader(message: VerifyPhoneReq, reader: jspb.BinaryReader): VerifyPhoneReq;
}

export namespace VerifyPhoneReq {
  export type AsObject = {
    token: string,
  }
}

export class InitiateStrongVerificationRes extends jspb.Message {
  getVerificationAttemptToken(): string;
  setVerificationAttemptToken(value: string): InitiateStrongVerificationRes;

  getRedirectUrl(): string;
  setRedirectUrl(value: string): InitiateStrongVerificationRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InitiateStrongVerificationRes.AsObject;
  static toObject(includeInstance: boolean, msg: InitiateStrongVerificationRes): InitiateStrongVerificationRes.AsObject;
  static serializeBinaryToWriter(message: InitiateStrongVerificationRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InitiateStrongVerificationRes;
  static deserializeBinaryFromReader(message: InitiateStrongVerificationRes, reader: jspb.BinaryReader): InitiateStrongVerificationRes;
}

export namespace InitiateStrongVerificationRes {
  export type AsObject = {
    verificationAttemptToken: string,
    redirectUrl: string,
  }
}

export class GetStrongVerificationAttemptStatusReq extends jspb.Message {
  getVerificationAttemptToken(): string;
  setVerificationAttemptToken(value: string): GetStrongVerificationAttemptStatusReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetStrongVerificationAttemptStatusReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetStrongVerificationAttemptStatusReq): GetStrongVerificationAttemptStatusReq.AsObject;
  static serializeBinaryToWriter(message: GetStrongVerificationAttemptStatusReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetStrongVerificationAttemptStatusReq;
  static deserializeBinaryFromReader(message: GetStrongVerificationAttemptStatusReq, reader: jspb.BinaryReader): GetStrongVerificationAttemptStatusReq;
}

export namespace GetStrongVerificationAttemptStatusReq {
  export type AsObject = {
    verificationAttemptToken: string,
  }
}

export class GetStrongVerificationAttemptStatusRes extends jspb.Message {
  getStatus(): StrongVerificationAttemptStatus;
  setStatus(value: StrongVerificationAttemptStatus): GetStrongVerificationAttemptStatusRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetStrongVerificationAttemptStatusRes.AsObject;
  static toObject(includeInstance: boolean, msg: GetStrongVerificationAttemptStatusRes): GetStrongVerificationAttemptStatusRes.AsObject;
  static serializeBinaryToWriter(message: GetStrongVerificationAttemptStatusRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetStrongVerificationAttemptStatusRes;
  static deserializeBinaryFromReader(message: GetStrongVerificationAttemptStatusRes, reader: jspb.BinaryReader): GetStrongVerificationAttemptStatusRes;
}

export namespace GetStrongVerificationAttemptStatusRes {
  export type AsObject = {
    status: StrongVerificationAttemptStatus,
  }
}

export class DeleteAccountReq extends jspb.Message {
  getConfirm(): boolean;
  setConfirm(value: boolean): DeleteAccountReq;

  getReason(): string;
  setReason(value: string): DeleteAccountReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteAccountReq.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteAccountReq): DeleteAccountReq.AsObject;
  static serializeBinaryToWriter(message: DeleteAccountReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteAccountReq;
  static deserializeBinaryFromReader(message: DeleteAccountReq, reader: jspb.BinaryReader): DeleteAccountReq;
}

export namespace DeleteAccountReq {
  export type AsObject = {
    confirm: boolean,
    reason: string,
  }
}

export class ModNote extends jspb.Message {
  getNoteId(): number;
  setNoteId(value: number): ModNote;

  getNoteContent(): string;
  setNoteContent(value: string): ModNote;

  getCreated(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setCreated(value?: google_protobuf_timestamp_pb.Timestamp): ModNote;
  hasCreated(): boolean;
  clearCreated(): ModNote;

  getAcknowledged(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setAcknowledged(value?: google_protobuf_timestamp_pb.Timestamp): ModNote;
  hasAcknowledged(): boolean;
  clearAcknowledged(): ModNote;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ModNote.AsObject;
  static toObject(includeInstance: boolean, msg: ModNote): ModNote.AsObject;
  static serializeBinaryToWriter(message: ModNote, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ModNote;
  static deserializeBinaryFromReader(message: ModNote, reader: jspb.BinaryReader): ModNote;
}

export namespace ModNote {
  export type AsObject = {
    noteId: number,
    noteContent: string,
    created?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    acknowledged?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class ListModNotesRes extends jspb.Message {
  getModNotesList(): Array<ModNote>;
  setModNotesList(value: Array<ModNote>): ListModNotesRes;
  clearModNotesList(): ListModNotesRes;
  addModNotes(value?: ModNote, index?: number): ModNote;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListModNotesRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListModNotesRes): ListModNotesRes.AsObject;
  static serializeBinaryToWriter(message: ListModNotesRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListModNotesRes;
  static deserializeBinaryFromReader(message: ListModNotesRes, reader: jspb.BinaryReader): ListModNotesRes;
}

export namespace ListModNotesRes {
  export type AsObject = {
    modNotesList: Array<ModNote.AsObject>,
  }
}

export class ListActiveSessionsReq extends jspb.Message {
  getPageSize(): number;
  setPageSize(value: number): ListActiveSessionsReq;

  getPageToken(): string;
  setPageToken(value: string): ListActiveSessionsReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListActiveSessionsReq.AsObject;
  static toObject(includeInstance: boolean, msg: ListActiveSessionsReq): ListActiveSessionsReq.AsObject;
  static serializeBinaryToWriter(message: ListActiveSessionsReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListActiveSessionsReq;
  static deserializeBinaryFromReader(message: ListActiveSessionsReq, reader: jspb.BinaryReader): ListActiveSessionsReq;
}

export namespace ListActiveSessionsReq {
  export type AsObject = {
    pageSize: number,
    pageToken: string,
  }
}

export class ActiveSession extends jspb.Message {
  getCreated(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setCreated(value?: google_protobuf_timestamp_pb.Timestamp): ActiveSession;
  hasCreated(): boolean;
  clearCreated(): ActiveSession;

  getExpiry(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setExpiry(value?: google_protobuf_timestamp_pb.Timestamp): ActiveSession;
  hasExpiry(): boolean;
  clearExpiry(): ActiveSession;

  getLastSeen(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setLastSeen(value?: google_protobuf_timestamp_pb.Timestamp): ActiveSession;
  hasLastSeen(): boolean;
  clearLastSeen(): ActiveSession;

  getOperatingSystem(): string;
  setOperatingSystem(value: string): ActiveSession;

  getBrowser(): string;
  setBrowser(value: string): ActiveSession;

  getDevice(): string;
  setDevice(value: string): ActiveSession;

  getApproximateLocation(): string;
  setApproximateLocation(value: string): ActiveSession;

  getIsCurrentSession(): boolean;
  setIsCurrentSession(value: boolean): ActiveSession;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ActiveSession.AsObject;
  static toObject(includeInstance: boolean, msg: ActiveSession): ActiveSession.AsObject;
  static serializeBinaryToWriter(message: ActiveSession, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ActiveSession;
  static deserializeBinaryFromReader(message: ActiveSession, reader: jspb.BinaryReader): ActiveSession;
}

export namespace ActiveSession {
  export type AsObject = {
    created?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    expiry?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    lastSeen?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    operatingSystem: string,
    browser: string,
    device: string,
    approximateLocation: string,
    isCurrentSession: boolean,
  }
}

export class ListActiveSessionsRes extends jspb.Message {
  getActiveSessionsList(): Array<ActiveSession>;
  setActiveSessionsList(value: Array<ActiveSession>): ListActiveSessionsRes;
  clearActiveSessionsList(): ListActiveSessionsRes;
  addActiveSessions(value?: ActiveSession, index?: number): ActiveSession;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListActiveSessionsRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListActiveSessionsRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListActiveSessionsRes): ListActiveSessionsRes.AsObject;
  static serializeBinaryToWriter(message: ListActiveSessionsRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListActiveSessionsRes;
  static deserializeBinaryFromReader(message: ListActiveSessionsRes, reader: jspb.BinaryReader): ListActiveSessionsRes;
}

export namespace ListActiveSessionsRes {
  export type AsObject = {
    activeSessionsList: Array<ActiveSession.AsObject>,
    nextPageToken: string,
  }
}

export class LogOutSessionReq extends jspb.Message {
  getCreated(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setCreated(value?: google_protobuf_timestamp_pb.Timestamp): LogOutSessionReq;
  hasCreated(): boolean;
  clearCreated(): LogOutSessionReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LogOutSessionReq.AsObject;
  static toObject(includeInstance: boolean, msg: LogOutSessionReq): LogOutSessionReq.AsObject;
  static serializeBinaryToWriter(message: LogOutSessionReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LogOutSessionReq;
  static deserializeBinaryFromReader(message: LogOutSessionReq, reader: jspb.BinaryReader): LogOutSessionReq;
}

export namespace LogOutSessionReq {
  export type AsObject = {
    created?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class LogOutOtherSessionsReq extends jspb.Message {
  getConfirm(): boolean;
  setConfirm(value: boolean): LogOutOtherSessionsReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LogOutOtherSessionsReq.AsObject;
  static toObject(includeInstance: boolean, msg: LogOutOtherSessionsReq): LogOutOtherSessionsReq.AsObject;
  static serializeBinaryToWriter(message: LogOutOtherSessionsReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LogOutOtherSessionsReq;
  static deserializeBinaryFromReader(message: LogOutOtherSessionsReq, reader: jspb.BinaryReader): LogOutOtherSessionsReq;
}

export namespace LogOutOtherSessionsReq {
  export type AsObject = {
    confirm: boolean,
  }
}

export class SetProfilePublicVisibilityReq extends jspb.Message {
  getProfilePublicVisibility(): ProfilePublicVisibility;
  setProfilePublicVisibility(value: ProfilePublicVisibility): SetProfilePublicVisibilityReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SetProfilePublicVisibilityReq.AsObject;
  static toObject(includeInstance: boolean, msg: SetProfilePublicVisibilityReq): SetProfilePublicVisibilityReq.AsObject;
  static serializeBinaryToWriter(message: SetProfilePublicVisibilityReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SetProfilePublicVisibilityReq;
  static deserializeBinaryFromReader(message: SetProfilePublicVisibilityReq, reader: jspb.BinaryReader): SetProfilePublicVisibilityReq;
}

export namespace SetProfilePublicVisibilityReq {
  export type AsObject = {
    profilePublicVisibility: ProfilePublicVisibility,
  }
}

export enum StrongVerificationAttemptStatus { 
  STRONG_VERIFICATION_ATTEMPT_STATUS_UNKNOWN = 0,
  STRONG_VERIFICATION_ATTEMPT_STATUS_SUCCEEDED = 1,
  STRONG_VERIFICATION_ATTEMPT_STATUS_IN_PROGRESS_WAITING_ON_USER_TO_OPEN_APP = 2,
  STRONG_VERIFICATION_ATTEMPT_STATUS_IN_PROGRESS_WAITING_ON_USER_IN_APP = 5,
  STRONG_VERIFICATION_ATTEMPT_STATUS_IN_PROGRESS_WAITING_ON_BACKEND = 3,
  STRONG_VERIFICATION_ATTEMPT_STATUS_FAILED = 4,
}
export enum ProfilePublicVisibility { 
  PROFILE_PUBLIC_VISIBILITY_UNKNOWN = 0,
  PROFILE_PUBLIC_VISIBILITY_NOTHING = 1,
  PROFILE_PUBLIC_VISIBILITY_MAP_ONLY = 2,
  PROFILE_PUBLIC_VISIBILITY_LIMITED = 3,
  PROFILE_PUBLIC_VISIBILITY_MOST = 4,
  PROFILE_PUBLIC_VISIBILITY_FULL = 5,
}
