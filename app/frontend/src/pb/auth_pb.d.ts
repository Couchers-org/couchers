import * as jspb from "google-protobuf"

export class LoginReq extends jspb.Message {
  getUsername(): string;
  setUsername(value: string): LoginReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LoginReq.AsObject;
  static toObject(includeInstance: boolean, msg: LoginReq): LoginReq.AsObject;
  static serializeBinaryToWriter(message: LoginReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LoginReq;
  static deserializeBinaryFromReader(message: LoginReq, reader: jspb.BinaryReader): LoginReq;
}

export namespace LoginReq {
  export type AsObject = {
    username: string,
  }
}

export class LoginRes extends jspb.Message {
  getNextStep(): LoginRes.LoginStep;
  setNextStep(value: LoginRes.LoginStep): LoginRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LoginRes.AsObject;
  static toObject(includeInstance: boolean, msg: LoginRes): LoginRes.AsObject;
  static serializeBinaryToWriter(message: LoginRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LoginRes;
  static deserializeBinaryFromReader(message: LoginRes, reader: jspb.BinaryReader): LoginRes;
}

export namespace LoginRes {
  export type AsObject = {
    nextStep: LoginRes.LoginStep,
  }

  export enum LoginStep { 
    NEED_PASSWORD = 0,
    SENT_LOGIN_EMAIL = 1,
    LOGIN_NO_SUCH_USER = 3,
  }
}

export class SignupReq extends jspb.Message {
  getEmail(): string;
  setEmail(value: string): SignupReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SignupReq.AsObject;
  static toObject(includeInstance: boolean, msg: SignupReq): SignupReq.AsObject;
  static serializeBinaryToWriter(message: SignupReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SignupReq;
  static deserializeBinaryFromReader(message: SignupReq, reader: jspb.BinaryReader): SignupReq;
}

export namespace SignupReq {
  export type AsObject = {
    email: string,
  }
}

export class SignupRes extends jspb.Message {
  getNextStep(): SignupRes.SignupStep;
  setNextStep(value: SignupRes.SignupStep): SignupRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SignupRes.AsObject;
  static toObject(includeInstance: boolean, msg: SignupRes): SignupRes.AsObject;
  static serializeBinaryToWriter(message: SignupRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SignupRes;
  static deserializeBinaryFromReader(message: SignupRes, reader: jspb.BinaryReader): SignupRes;
}

export namespace SignupRes {
  export type AsObject = {
    nextStep: SignupRes.SignupStep,
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

  getCity(): string;
  setCity(value: string): CompleteSignupReq;

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
    city: string,
    birthdate: string,
    gender: string,
  }
}

export class AuthReq extends jspb.Message {
  getUsername(): string;
  setUsername(value: string): AuthReq;

  getPassword(): string;
  setPassword(value: string): AuthReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AuthReq.AsObject;
  static toObject(includeInstance: boolean, msg: AuthReq): AuthReq.AsObject;
  static serializeBinaryToWriter(message: AuthReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AuthReq;
  static deserializeBinaryFromReader(message: AuthReq, reader: jspb.BinaryReader): AuthReq;
}

export namespace AuthReq {
  export type AsObject = {
    username: string,
    password: string,
  }
}

export class AuthRes extends jspb.Message {
  getToken(): string;
  setToken(value: string): AuthRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AuthRes.AsObject;
  static toObject(includeInstance: boolean, msg: AuthRes): AuthRes.AsObject;
  static serializeBinaryToWriter(message: AuthRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AuthRes;
  static deserializeBinaryFromReader(message: AuthRes, reader: jspb.BinaryReader): AuthRes;
}

export namespace AuthRes {
  export type AsObject = {
    token: string,
  }
}

export class DeAuthReq extends jspb.Message {
  getToken(): string;
  setToken(value: string): DeAuthReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeAuthReq.AsObject;
  static toObject(includeInstance: boolean, msg: DeAuthReq): DeAuthReq.AsObject;
  static serializeBinaryToWriter(message: DeAuthReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeAuthReq;
  static deserializeBinaryFromReader(message: DeAuthReq, reader: jspb.BinaryReader): DeAuthReq;
}

export namespace DeAuthReq {
  export type AsObject = {
    token: string,
  }
}

export class DeAuthRes extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeAuthRes.AsObject;
  static toObject(includeInstance: boolean, msg: DeAuthRes): DeAuthRes.AsObject;
  static serializeBinaryToWriter(message: DeAuthRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeAuthRes;
  static deserializeBinaryFromReader(message: DeAuthRes, reader: jspb.BinaryReader): DeAuthRes;
}

export namespace DeAuthRes {
  export type AsObject = {
  }
}

