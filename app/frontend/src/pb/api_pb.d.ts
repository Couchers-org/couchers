import * as jspb from "google-protobuf"

export class User extends jspb.Message {
  getId(): number;
  setId(value: number): User;

  getUsername(): string;
  setUsername(value: string): User;

  getName(): string;
  setName(value: string): User;

  getCity(): string;
  setCity(value: string): User;

  getVerification(): number;
  setVerification(value: number): User;

  getCommunityStanding(): number;
  setCommunityStanding(value: number): User;

  getNumReferences(): number;
  setNumReferences(value: number): User;

  getGender(): string;
  setGender(value: string): User;

  getAge(): number;
  setAge(value: number): User;

  getLanguagesList(): Array<string>;
  setLanguagesList(value: Array<string>): User;
  clearLanguagesList(): User;
  addLanguages(value: string, index?: number): User;

  getOccupation(): string;
  setOccupation(value: string): User;

  getAboutMe(): string;
  setAboutMe(value: string): User;

  getWhy(): string;
  setWhy(value: string): User;

  getThing(): string;
  setThing(value: string): User;

  getShare(): string;
  setShare(value: string): User;

  getCountriesVisitedList(): Array<string>;
  setCountriesVisitedList(value: Array<string>): User;
  clearCountriesVisitedList(): User;
  addCountriesVisited(value: string, index?: number): User;

  getCountriesLivedList(): Array<string>;
  setCountriesLivedList(value: Array<string>): User;
  clearCountriesLivedList(): User;
  addCountriesLived(value: string, index?: number): User;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): User.AsObject;
  static toObject(includeInstance: boolean, msg: User): User.AsObject;
  static serializeBinaryToWriter(message: User, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): User;
  static deserializeBinaryFromReader(message: User, reader: jspb.BinaryReader): User;
}

export namespace User {
  export type AsObject = {
    id: number,
    username: string,
    name: string,
    city: string,
    verification: number,
    communityStanding: number,
    numReferences: number,
    gender: string,
    age: number,
    languagesList: Array<string>,
    occupation: string,
    aboutMe: string,
    why: string,
    thing: string,
    share: string,
    countriesVisitedList: Array<string>,
    countriesLivedList: Array<string>,
  }
}

export class GetUserByIdReq extends jspb.Message {
  getId(): number;
  setId(value: number): GetUserByIdReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetUserByIdReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetUserByIdReq): GetUserByIdReq.AsObject;
  static serializeBinaryToWriter(message: GetUserByIdReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetUserByIdReq;
  static deserializeBinaryFromReader(message: GetUserByIdReq, reader: jspb.BinaryReader): GetUserByIdReq;
}

export namespace GetUserByIdReq {
  export type AsObject = {
    id: number,
  }
}

