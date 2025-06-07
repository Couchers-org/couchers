import * as jspb from 'google-protobuf'

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as annotations_pb from './annotations_pb'; // proto import: "annotations.proto"


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

export class CommunityGuideline extends jspb.Message {
  getTitle(): string;
  setTitle(value: string): CommunityGuideline;

  getGuideline(): string;
  setGuideline(value: string): CommunityGuideline;

  getIconSvg(): string;
  setIconSvg(value: string): CommunityGuideline;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CommunityGuideline.AsObject;
  static toObject(includeInstance: boolean, msg: CommunityGuideline): CommunityGuideline.AsObject;
  static serializeBinaryToWriter(message: CommunityGuideline, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CommunityGuideline;
  static deserializeBinaryFromReader(message: CommunityGuideline, reader: jspb.BinaryReader): CommunityGuideline;
}

export namespace CommunityGuideline {
  export type AsObject = {
    title: string,
    guideline: string,
    iconSvg: string,
  }
}

export class GetCommunityGuidelinesRes extends jspb.Message {
  getCommunityGuidelinesList(): Array<CommunityGuideline>;
  setCommunityGuidelinesList(value: Array<CommunityGuideline>): GetCommunityGuidelinesRes;
  clearCommunityGuidelinesList(): GetCommunityGuidelinesRes;
  addCommunityGuidelines(value?: CommunityGuideline, index?: number): CommunityGuideline;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetCommunityGuidelinesRes.AsObject;
  static toObject(includeInstance: boolean, msg: GetCommunityGuidelinesRes): GetCommunityGuidelinesRes.AsObject;
  static serializeBinaryToWriter(message: GetCommunityGuidelinesRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetCommunityGuidelinesRes;
  static deserializeBinaryFromReader(message: GetCommunityGuidelinesRes, reader: jspb.BinaryReader): GetCommunityGuidelinesRes;
}

export namespace GetCommunityGuidelinesRes {
  export type AsObject = {
    communityGuidelinesList: Array<CommunityGuideline.AsObject>,
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

export class Badge extends jspb.Message {
  getId(): string;
  setId(value: string): Badge;

  getName(): string;
  setName(value: string): Badge;

  getDescription(): string;
  setDescription(value: string): Badge;

  getColor(): string;
  setColor(value: string): Badge;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Badge.AsObject;
  static toObject(includeInstance: boolean, msg: Badge): Badge.AsObject;
  static serializeBinaryToWriter(message: Badge, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Badge;
  static deserializeBinaryFromReader(message: Badge, reader: jspb.BinaryReader): Badge;
}

export namespace Badge {
  export type AsObject = {
    id: string,
    name: string,
    description: string,
    color: string,
  }
}

export class GetBadgesRes extends jspb.Message {
  getBadgesList(): Array<Badge>;
  setBadgesList(value: Array<Badge>): GetBadgesRes;
  clearBadgesList(): GetBadgesRes;
  addBadges(value?: Badge, index?: number): Badge;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetBadgesRes.AsObject;
  static toObject(includeInstance: boolean, msg: GetBadgesRes): GetBadgesRes.AsObject;
  static serializeBinaryToWriter(message: GetBadgesRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetBadgesRes;
  static deserializeBinaryFromReader(message: GetBadgesRes, reader: jspb.BinaryReader): GetBadgesRes;
}

export namespace GetBadgesRes {
  export type AsObject = {
    badgesList: Array<Badge.AsObject>,
  }
}

