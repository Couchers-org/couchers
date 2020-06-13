import * as jspb from "google-protobuf"

export class LoginRequest extends jspb.Message {
  getUsername(): string;
  setUsername(value: string): LoginRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LoginRequest.AsObject;
  static toObject(includeInstance: boolean, msg: LoginRequest): LoginRequest.AsObject;
  static serializeBinaryToWriter(message: LoginRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LoginRequest;
  static deserializeBinaryFromReader(message: LoginRequest, reader: jspb.BinaryReader): LoginRequest;
}

export namespace LoginRequest {
  export type AsObject = {
    username: string,
  }
}

export class LoginResponse extends jspb.Message {
  getNextStep(): LoginResponse.LoginStep;
  setNextStep(value: LoginResponse.LoginStep): LoginResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LoginResponse.AsObject;
  static toObject(includeInstance: boolean, msg: LoginResponse): LoginResponse.AsObject;
  static serializeBinaryToWriter(message: LoginResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LoginResponse;
  static deserializeBinaryFromReader(message: LoginResponse, reader: jspb.BinaryReader): LoginResponse;
}

export namespace LoginResponse {
  export type AsObject = {
    nextStep: LoginResponse.LoginStep,
  }

  export enum LoginStep { 
    NEED_PASSWORD = 0,
    SENT_LOGIN_EMAIL = 1,
    LOGIN_NO_SUCH_USER = 3,
  }
}

export class SignupRequest extends jspb.Message {
  getEmail(): string;
  setEmail(value: string): SignupRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SignupRequest.AsObject;
  static toObject(includeInstance: boolean, msg: SignupRequest): SignupRequest.AsObject;
  static serializeBinaryToWriter(message: SignupRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SignupRequest;
  static deserializeBinaryFromReader(message: SignupRequest, reader: jspb.BinaryReader): SignupRequest;
}

export namespace SignupRequest {
  export type AsObject = {
    email: string,
  }
}

export class SignupResponse extends jspb.Message {
  getNextStep(): SignupResponse.SignupStep;
  setNextStep(value: SignupResponse.SignupStep): SignupResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SignupResponse.AsObject;
  static toObject(includeInstance: boolean, msg: SignupResponse): SignupResponse.AsObject;
  static serializeBinaryToWriter(message: SignupResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SignupResponse;
  static deserializeBinaryFromReader(message: SignupResponse, reader: jspb.BinaryReader): SignupResponse;
}

export namespace SignupResponse {
  export type AsObject = {
    nextStep: SignupResponse.SignupStep,
  }

  export enum SignupStep { 
    SENT_SIGNUP_EMAIL = 0,
    EMAIL_EXISTS = 1,
    INVALID_EMAIL = 2,
  }
}

export class CompleteTokenLoginReq extends jspb.Message {
  getToken(): string;
  setToken(value: string): CompleteTokenLoginReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CompleteTokenLoginReq.AsObject;
  static toObject(includeInstance: boolean, msg: CompleteTokenLoginReq): CompleteTokenLoginReq.AsObject;
  static serializeBinaryToWriter(message: CompleteTokenLoginReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CompleteTokenLoginReq;
  static deserializeBinaryFromReader(message: CompleteTokenLoginReq, reader: jspb.BinaryReader): CompleteTokenLoginReq;
}

export namespace CompleteTokenLoginReq {
  export type AsObject = {
    token: string,
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

export class SignupTokenInfoReq extends jspb.Message {
  getToken(): string;
  setToken(value: string): SignupTokenInfoReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SignupTokenInfoReq.AsObject;
  static toObject(includeInstance: boolean, msg: SignupTokenInfoReq): SignupTokenInfoReq.AsObject;
  static serializeBinaryToWriter(message: SignupTokenInfoReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SignupTokenInfoReq;
  static deserializeBinaryFromReader(message: SignupTokenInfoReq, reader: jspb.BinaryReader): SignupTokenInfoReq;
}

export namespace SignupTokenInfoReq {
  export type AsObject = {
    token: string,
  }
}

export class SignupTokenInfoRes extends jspb.Message {
  getEmail(): string;
  setEmail(value: string): SignupTokenInfoRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SignupTokenInfoRes.AsObject;
  static toObject(includeInstance: boolean, msg: SignupTokenInfoRes): SignupTokenInfoRes.AsObject;
  static serializeBinaryToWriter(message: SignupTokenInfoRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SignupTokenInfoRes;
  static deserializeBinaryFromReader(message: SignupTokenInfoRes, reader: jspb.BinaryReader): SignupTokenInfoRes;
}

export namespace SignupTokenInfoRes {
  export type AsObject = {
    email: string,
  }
}

export class CompleteSignupReq extends jspb.Message {
  getToken(): string;
  setToken(value: string): CompleteSignupReq;

  getName(): string;
  setName(value: string): CompleteSignupReq;

  getHometown(): string;
  setHometown(value: string): CompleteSignupReq;

  getBirthdate(): string;
  setBirthdate(value: string): CompleteSignupReq;

  getGender(): string;
  setGender(value: string): CompleteSignupReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CompleteSignupReq.AsObject;
  static toObject(includeInstance: boolean, msg: CompleteSignupReq): CompleteSignupReq.AsObject;
  static serializeBinaryToWriter(message: CompleteSignupReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CompleteSignupReq;
  static deserializeBinaryFromReader(message: CompleteSignupReq, reader: jspb.BinaryReader): CompleteSignupReq;
}

export namespace CompleteSignupReq {
  export type AsObject = {
    token: string,
    name: string,
    hometown: string,
    birthdate: string,
    gender: string,
  }
}

export class AuthRequest extends jspb.Message {
  getUsername(): string;
  setUsername(value: string): AuthRequest;

  getPassword(): string;
  setPassword(value: string): AuthRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AuthRequest.AsObject;
  static toObject(includeInstance: boolean, msg: AuthRequest): AuthRequest.AsObject;
  static serializeBinaryToWriter(message: AuthRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AuthRequest;
  static deserializeBinaryFromReader(message: AuthRequest, reader: jspb.BinaryReader): AuthRequest;
}

export namespace AuthRequest {
  export type AsObject = {
    username: string,
    password: string,
  }
}

export class AuthResponse extends jspb.Message {
  getToken(): string;
  setToken(value: string): AuthResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AuthResponse.AsObject;
  static toObject(includeInstance: boolean, msg: AuthResponse): AuthResponse.AsObject;
  static serializeBinaryToWriter(message: AuthResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AuthResponse;
  static deserializeBinaryFromReader(message: AuthResponse, reader: jspb.BinaryReader): AuthResponse;
}

export namespace AuthResponse {
  export type AsObject = {
    token: string,
  }
}

export class DeauthRequest extends jspb.Message {
  getToken(): string;
  setToken(value: string): DeauthRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeauthRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DeauthRequest): DeauthRequest.AsObject;
  static serializeBinaryToWriter(message: DeauthRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeauthRequest;
  static deserializeBinaryFromReader(message: DeauthRequest, reader: jspb.BinaryReader): DeauthRequest;
}

export namespace DeauthRequest {
  export type AsObject = {
    token: string,
  }
}

export class DeauthResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeauthResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeauthResponse): DeauthResponse.AsObject;
  static serializeBinaryToWriter(message: DeauthResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeauthResponse;
  static deserializeBinaryFromReader(message: DeauthResponse, reader: jspb.BinaryReader): DeauthResponse;
}

export namespace DeauthResponse {
  export type AsObject = {
  }
}

