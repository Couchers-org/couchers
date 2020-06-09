import * as jspb from "google-protobuf"

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
  getOk(): boolean;
  setOk(value: boolean): DeauthResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeauthResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeauthResponse): DeauthResponse.AsObject;
  static serializeBinaryToWriter(message: DeauthResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeauthResponse;
  static deserializeBinaryFromReader(message: DeauthResponse, reader: jspb.BinaryReader): DeauthResponse;
}

export namespace DeauthResponse {
  export type AsObject = {
    ok: boolean,
  }
}

