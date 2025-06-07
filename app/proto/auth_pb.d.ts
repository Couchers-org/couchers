import * as jspb from 'google-protobuf'

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as google_protobuf_wrappers_pb from 'google-protobuf/google/protobuf/wrappers_pb'; // proto import: "google/protobuf/wrappers.proto"
import * as annotations_pb from './annotations_pb'; // proto import: "annotations.proto"
import * as api_pb from './api_pb'; // proto import: "api.proto"


export class SignupFlowReq extends jspb.Message {
  getFlowToken(): string;
  setFlowToken(value: string): SignupFlowReq;

  getBasic(): SignupBasic | undefined;
  setBasic(value?: SignupBasic): SignupFlowReq;
  hasBasic(): boolean;
  clearBasic(): SignupFlowReq;

  getAccount(): SignupAccount | undefined;
  setAccount(value?: SignupAccount): SignupFlowReq;
  hasAccount(): boolean;
  clearAccount(): SignupFlowReq;

  getFeedback(): ContributorForm | undefined;
  setFeedback(value?: ContributorForm): SignupFlowReq;
  hasFeedback(): boolean;
  clearFeedback(): SignupFlowReq;

  getEmailToken(): string;
  setEmailToken(value: string): SignupFlowReq;

  getAcceptCommunityGuidelines(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setAcceptCommunityGuidelines(value?: google_protobuf_wrappers_pb.BoolValue): SignupFlowReq;
  hasAcceptCommunityGuidelines(): boolean;
  clearAcceptCommunityGuidelines(): SignupFlowReq;

  getResendVerificationEmail(): boolean;
  setResendVerificationEmail(value: boolean): SignupFlowReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SignupFlowReq.AsObject;
  static toObject(includeInstance: boolean, msg: SignupFlowReq): SignupFlowReq.AsObject;
  static serializeBinaryToWriter(message: SignupFlowReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SignupFlowReq;
  static deserializeBinaryFromReader(message: SignupFlowReq, reader: jspb.BinaryReader): SignupFlowReq;
}

export namespace SignupFlowReq {
  export type AsObject = {
    flowToken: string,
    basic?: SignupBasic.AsObject,
    account?: SignupAccount.AsObject,
    feedback?: ContributorForm.AsObject,
    emailToken: string,
    acceptCommunityGuidelines?: google_protobuf_wrappers_pb.BoolValue.AsObject,
    resendVerificationEmail: boolean,
  }
}

export class SignupFlowRes extends jspb.Message {
  getFlowToken(): string;
  setFlowToken(value: string): SignupFlowRes;

  getAuthRes(): AuthRes | undefined;
  setAuthRes(value?: AuthRes): SignupFlowRes;
  hasAuthRes(): boolean;
  clearAuthRes(): SignupFlowRes;

  getNeedBasic(): boolean;
  setNeedBasic(value: boolean): SignupFlowRes;

  getNeedAccount(): boolean;
  setNeedAccount(value: boolean): SignupFlowRes;

  getNeedFeedback(): boolean;
  setNeedFeedback(value: boolean): SignupFlowRes;

  getNeedVerifyEmail(): boolean;
  setNeedVerifyEmail(value: boolean): SignupFlowRes;

  getNeedAcceptCommunityGuidelines(): boolean;
  setNeedAcceptCommunityGuidelines(value: boolean): SignupFlowRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SignupFlowRes.AsObject;
  static toObject(includeInstance: boolean, msg: SignupFlowRes): SignupFlowRes.AsObject;
  static serializeBinaryToWriter(message: SignupFlowRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SignupFlowRes;
  static deserializeBinaryFromReader(message: SignupFlowRes, reader: jspb.BinaryReader): SignupFlowRes;
}

export namespace SignupFlowRes {
  export type AsObject = {
    flowToken: string,
    authRes?: AuthRes.AsObject,
    needBasic: boolean,
    needAccount: boolean,
    needFeedback: boolean,
    needVerifyEmail: boolean,
    needAcceptCommunityGuidelines: boolean,
  }
}

export class SignupBasic extends jspb.Message {
  getName(): string;
  setName(value: string): SignupBasic;

  getEmail(): string;
  setEmail(value: string): SignupBasic;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SignupBasic.AsObject;
  static toObject(includeInstance: boolean, msg: SignupBasic): SignupBasic.AsObject;
  static serializeBinaryToWriter(message: SignupBasic, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SignupBasic;
  static deserializeBinaryFromReader(message: SignupBasic, reader: jspb.BinaryReader): SignupBasic;
}

export namespace SignupBasic {
  export type AsObject = {
    name: string,
    email: string,
  }
}

export class SignupTokenInfoReq extends jspb.Message {
  getSignupToken(): string;
  setSignupToken(value: string): SignupTokenInfoReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SignupTokenInfoReq.AsObject;
  static toObject(includeInstance: boolean, msg: SignupTokenInfoReq): SignupTokenInfoReq.AsObject;
  static serializeBinaryToWriter(message: SignupTokenInfoReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SignupTokenInfoReq;
  static deserializeBinaryFromReader(message: SignupTokenInfoReq, reader: jspb.BinaryReader): SignupTokenInfoReq;
}

export namespace SignupTokenInfoReq {
  export type AsObject = {
    signupToken: string,
  }
}

export class SignupAccount extends jspb.Message {
  getUsername(): string;
  setUsername(value: string): SignupAccount;

  getPassword(): string;
  setPassword(value: string): SignupAccount;

  getCity(): string;
  setCity(value: string): SignupAccount;

  getLat(): number;
  setLat(value: number): SignupAccount;

  getLng(): number;
  setLng(value: number): SignupAccount;

  getRadius(): number;
  setRadius(value: number): SignupAccount;

  getBirthdate(): string;
  setBirthdate(value: string): SignupAccount;

  getGender(): string;
  setGender(value: string): SignupAccount;

  getHostingStatus(): api_pb.HostingStatus;
  setHostingStatus(value: api_pb.HostingStatus): SignupAccount;

  getAcceptTos(): boolean;
  setAcceptTos(value: boolean): SignupAccount;

  getOptOutOfNewsletter(): boolean;
  setOptOutOfNewsletter(value: boolean): SignupAccount;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SignupAccount.AsObject;
  static toObject(includeInstance: boolean, msg: SignupAccount): SignupAccount.AsObject;
  static serializeBinaryToWriter(message: SignupAccount, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SignupAccount;
  static deserializeBinaryFromReader(message: SignupAccount, reader: jspb.BinaryReader): SignupAccount;
}

export namespace SignupAccount {
  export type AsObject = {
    username: string,
    password: string,
    city: string,
    lat: number,
    lng: number,
    radius: number,
    birthdate: string,
    gender: string,
    hostingStatus: api_pb.HostingStatus,
    acceptTos: boolean,
    optOutOfNewsletter: boolean,
  }
}

export class UsernameValidReq extends jspb.Message {
  getUsername(): string;
  setUsername(value: string): UsernameValidReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UsernameValidReq.AsObject;
  static toObject(includeInstance: boolean, msg: UsernameValidReq): UsernameValidReq.AsObject;
  static serializeBinaryToWriter(message: UsernameValidReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UsernameValidReq;
  static deserializeBinaryFromReader(message: UsernameValidReq, reader: jspb.BinaryReader): UsernameValidReq;
}

export namespace UsernameValidReq {
  export type AsObject = {
    username: string,
  }
}

export class UsernameValidRes extends jspb.Message {
  getValid(): boolean;
  setValid(value: boolean): UsernameValidRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UsernameValidRes.AsObject;
  static toObject(includeInstance: boolean, msg: UsernameValidRes): UsernameValidRes.AsObject;
  static serializeBinaryToWriter(message: UsernameValidRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UsernameValidRes;
  static deserializeBinaryFromReader(message: UsernameValidRes, reader: jspb.BinaryReader): UsernameValidRes;
}

export namespace UsernameValidRes {
  export type AsObject = {
    valid: boolean,
  }
}

export class AuthReq extends jspb.Message {
  getUser(): string;
  setUser(value: string): AuthReq;

  getPassword(): string;
  setPassword(value: string): AuthReq;

  getRememberDevice(): boolean;
  setRememberDevice(value: boolean): AuthReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AuthReq.AsObject;
  static toObject(includeInstance: boolean, msg: AuthReq): AuthReq.AsObject;
  static serializeBinaryToWriter(message: AuthReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AuthReq;
  static deserializeBinaryFromReader(message: AuthReq, reader: jspb.BinaryReader): AuthReq;
}

export namespace AuthReq {
  export type AsObject = {
    user: string,
    password: string,
    rememberDevice: boolean,
  }
}

export class AuthRes extends jspb.Message {
  getUserId(): number;
  setUserId(value: number): AuthRes;

  getJailed(): boolean;
  setJailed(value: boolean): AuthRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AuthRes.AsObject;
  static toObject(includeInstance: boolean, msg: AuthRes): AuthRes.AsObject;
  static serializeBinaryToWriter(message: AuthRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AuthRes;
  static deserializeBinaryFromReader(message: AuthRes, reader: jspb.BinaryReader): AuthRes;
}

export namespace AuthRes {
  export type AsObject = {
    userId: number,
    jailed: boolean,
  }
}

export class GetAuthStateRes extends jspb.Message {
  getLoggedIn(): boolean;
  setLoggedIn(value: boolean): GetAuthStateRes;

  getAuthRes(): AuthRes | undefined;
  setAuthRes(value?: AuthRes): GetAuthStateRes;
  hasAuthRes(): boolean;
  clearAuthRes(): GetAuthStateRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetAuthStateRes.AsObject;
  static toObject(includeInstance: boolean, msg: GetAuthStateRes): GetAuthStateRes.AsObject;
  static serializeBinaryToWriter(message: GetAuthStateRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetAuthStateRes;
  static deserializeBinaryFromReader(message: GetAuthStateRes, reader: jspb.BinaryReader): GetAuthStateRes;
}

export namespace GetAuthStateRes {
  export type AsObject = {
    loggedIn: boolean,
    authRes?: AuthRes.AsObject,
  }
}

export class ResetPasswordReq extends jspb.Message {
  getUser(): string;
  setUser(value: string): ResetPasswordReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ResetPasswordReq.AsObject;
  static toObject(includeInstance: boolean, msg: ResetPasswordReq): ResetPasswordReq.AsObject;
  static serializeBinaryToWriter(message: ResetPasswordReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ResetPasswordReq;
  static deserializeBinaryFromReader(message: ResetPasswordReq, reader: jspb.BinaryReader): ResetPasswordReq;
}

export namespace ResetPasswordReq {
  export type AsObject = {
    user: string,
  }
}

export class CompletePasswordResetV2Req extends jspb.Message {
  getPasswordResetToken(): string;
  setPasswordResetToken(value: string): CompletePasswordResetV2Req;

  getNewPassword(): string;
  setNewPassword(value: string): CompletePasswordResetV2Req;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CompletePasswordResetV2Req.AsObject;
  static toObject(includeInstance: boolean, msg: CompletePasswordResetV2Req): CompletePasswordResetV2Req.AsObject;
  static serializeBinaryToWriter(message: CompletePasswordResetV2Req, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CompletePasswordResetV2Req;
  static deserializeBinaryFromReader(message: CompletePasswordResetV2Req, reader: jspb.BinaryReader): CompletePasswordResetV2Req;
}

export namespace CompletePasswordResetV2Req {
  export type AsObject = {
    passwordResetToken: string,
    newPassword: string,
  }
}

export class ConfirmChangeEmailV2Req extends jspb.Message {
  getChangeEmailToken(): string;
  setChangeEmailToken(value: string): ConfirmChangeEmailV2Req;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ConfirmChangeEmailV2Req.AsObject;
  static toObject(includeInstance: boolean, msg: ConfirmChangeEmailV2Req): ConfirmChangeEmailV2Req.AsObject;
  static serializeBinaryToWriter(message: ConfirmChangeEmailV2Req, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ConfirmChangeEmailV2Req;
  static deserializeBinaryFromReader(message: ConfirmChangeEmailV2Req, reader: jspb.BinaryReader): ConfirmChangeEmailV2Req;
}

export namespace ConfirmChangeEmailV2Req {
  export type AsObject = {
    changeEmailToken: string,
  }
}

export class ContributorForm extends jspb.Message {
  getIdeas(): string;
  setIdeas(value: string): ContributorForm;

  getFeatures(): string;
  setFeatures(value: string): ContributorForm;

  getExperience(): string;
  setExperience(value: string): ContributorForm;

  getContribute(): ContributeOption;
  setContribute(value: ContributeOption): ContributorForm;

  getContributeWaysList(): Array<string>;
  setContributeWaysList(value: Array<string>): ContributorForm;
  clearContributeWaysList(): ContributorForm;
  addContributeWays(value: string, index?: number): ContributorForm;

  getExpertise(): string;
  setExpertise(value: string): ContributorForm;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ContributorForm.AsObject;
  static toObject(includeInstance: boolean, msg: ContributorForm): ContributorForm.AsObject;
  static serializeBinaryToWriter(message: ContributorForm, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ContributorForm;
  static deserializeBinaryFromReader(message: ContributorForm, reader: jspb.BinaryReader): ContributorForm;
}

export namespace ContributorForm {
  export type AsObject = {
    ideas: string,
    features: string,
    experience: string,
    contribute: ContributeOption,
    contributeWaysList: Array<string>,
    expertise: string,
  }
}

export class ConfirmDeleteAccountReq extends jspb.Message {
  getToken(): string;
  setToken(value: string): ConfirmDeleteAccountReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ConfirmDeleteAccountReq.AsObject;
  static toObject(includeInstance: boolean, msg: ConfirmDeleteAccountReq): ConfirmDeleteAccountReq.AsObject;
  static serializeBinaryToWriter(message: ConfirmDeleteAccountReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ConfirmDeleteAccountReq;
  static deserializeBinaryFromReader(message: ConfirmDeleteAccountReq, reader: jspb.BinaryReader): ConfirmDeleteAccountReq;
}

export namespace ConfirmDeleteAccountReq {
  export type AsObject = {
    token: string,
  }
}

export class RecoverAccountReq extends jspb.Message {
  getToken(): string;
  setToken(value: string): RecoverAccountReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RecoverAccountReq.AsObject;
  static toObject(includeInstance: boolean, msg: RecoverAccountReq): RecoverAccountReq.AsObject;
  static serializeBinaryToWriter(message: RecoverAccountReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RecoverAccountReq;
  static deserializeBinaryFromReader(message: RecoverAccountReq, reader: jspb.BinaryReader): RecoverAccountReq;
}

export namespace RecoverAccountReq {
  export type AsObject = {
    token: string,
  }
}

export class UnsubscribeReq extends jspb.Message {
  getPayload(): Uint8Array | string;
  getPayload_asU8(): Uint8Array;
  getPayload_asB64(): string;
  setPayload(value: Uint8Array | string): UnsubscribeReq;

  getSig(): Uint8Array | string;
  getSig_asU8(): Uint8Array;
  getSig_asB64(): string;
  setSig(value: Uint8Array | string): UnsubscribeReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UnsubscribeReq.AsObject;
  static toObject(includeInstance: boolean, msg: UnsubscribeReq): UnsubscribeReq.AsObject;
  static serializeBinaryToWriter(message: UnsubscribeReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UnsubscribeReq;
  static deserializeBinaryFromReader(message: UnsubscribeReq, reader: jspb.BinaryReader): UnsubscribeReq;
}

export namespace UnsubscribeReq {
  export type AsObject = {
    payload: Uint8Array | string,
    sig: Uint8Array | string,
  }
}

export class UnsubscribeRes extends jspb.Message {
  getResponse(): string;
  setResponse(value: string): UnsubscribeRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UnsubscribeRes.AsObject;
  static toObject(includeInstance: boolean, msg: UnsubscribeRes): UnsubscribeRes.AsObject;
  static serializeBinaryToWriter(message: UnsubscribeRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UnsubscribeRes;
  static deserializeBinaryFromReader(message: UnsubscribeRes, reader: jspb.BinaryReader): UnsubscribeRes;
}

export namespace UnsubscribeRes {
  export type AsObject = {
    response: string,
  }
}

export enum ContributeOption { 
  CONTRIBUTE_OPTION_UNSPECIFIED = 0,
  CONTRIBUTE_OPTION_YES = 1,
  CONTRIBUTE_OPTION_MAYBE = 2,
  CONTRIBUTE_OPTION_NO = 3,
}
