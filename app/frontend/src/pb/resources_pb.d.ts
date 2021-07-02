import * as jspb from 'google-protobuf'

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';


export class GetTermsOfServiceRes extends jspb.Message {
  getTermsOfService(): string;
  setTermsOfService(value: string): GetTermsOfServiceRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetTermsOfServiceRes.AsObject;
  static toObject(includeInstance: boolean, msg: GetTermsOfServiceRes): GetTermsOfServiceRes.AsObject;
  static serializeBinaryToWriter(message: GetTermsOfServiceRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetTermsOfServiceRes;
  static deserializeBinaryFromReader(message: GetTermsOfServiceRes, reader: jspb.BinaryReader): GetTermsOfServiceRes;
}

export namespace GetTermsOfServiceRes {
  export type AsObject = {
    termsOfService: string,
  }
}

export class Region extends jspb.Message {
  getAlpha3(): string;
  setAlpha3(value: string): Region;

  getName(): string;
  setName(value: string): Region;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Region.AsObject;
  static toObject(includeInstance: boolean, msg: Region): Region.AsObject;
  static serializeBinaryToWriter(message: Region, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Region;
  static deserializeBinaryFromReader(message: Region, reader: jspb.BinaryReader): Region;
}

export namespace Region {
  export type AsObject = {
    alpha3: string,
    name: string,
  }
}

export class GetRegionsRes extends jspb.Message {
  getRegionsList(): Array<Region>;
  setRegionsList(value: Array<Region>): GetRegionsRes;
  clearRegionsList(): GetRegionsRes;
  addRegions(value?: Region, index?: number): Region;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetRegionsRes.AsObject;
  static toObject(includeInstance: boolean, msg: GetRegionsRes): GetRegionsRes.AsObject;
  static serializeBinaryToWriter(message: GetRegionsRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetRegionsRes;
  static deserializeBinaryFromReader(message: GetRegionsRes, reader: jspb.BinaryReader): GetRegionsRes;
}

export namespace GetRegionsRes {
  export type AsObject = {
    regionsList: Array<Region.AsObject>,
  }
}

export class Language extends jspb.Message {
  getCode(): string;
  setCode(value: string): Language;

  getName(): string;
  setName(value: string): Language;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Language.AsObject;
  static toObject(includeInstance: boolean, msg: Language): Language.AsObject;
  static serializeBinaryToWriter(message: Language, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Language;
  static deserializeBinaryFromReader(message: Language, reader: jspb.BinaryReader): Language;
}

export namespace Language {
  export type AsObject = {
    code: string,
    name: string,
  }
}

export class GetLanguagesRes extends jspb.Message {
  getLanguagesList(): Array<Language>;
  setLanguagesList(value: Array<Language>): GetLanguagesRes;
  clearLanguagesList(): GetLanguagesRes;
  addLanguages(value?: Language, index?: number): Language;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetLanguagesRes.AsObject;
  static toObject(includeInstance: boolean, msg: GetLanguagesRes): GetLanguagesRes.AsObject;
  static serializeBinaryToWriter(message: GetLanguagesRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetLanguagesRes;
  static deserializeBinaryFromReader(message: GetLanguagesRes, reader: jspb.BinaryReader): GetLanguagesRes;
}

export namespace GetLanguagesRes {
  export type AsObject = {
    languagesList: Array<Language.AsObject>,
  }
}

