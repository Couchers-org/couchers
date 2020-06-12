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

