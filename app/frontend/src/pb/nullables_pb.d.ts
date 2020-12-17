import * as jspb from 'google-protobuf'



export class NullableBoolValue extends jspb.Message {
  getIsNull(): boolean;
  setIsNull(value: boolean): NullableBoolValue;

  getValue(): boolean;
  setValue(value: boolean): NullableBoolValue;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NullableBoolValue.AsObject;
  static toObject(includeInstance: boolean, msg: NullableBoolValue): NullableBoolValue.AsObject;
  static serializeBinaryToWriter(message: NullableBoolValue, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NullableBoolValue;
  static deserializeBinaryFromReader(message: NullableBoolValue, reader: jspb.BinaryReader): NullableBoolValue;
}

export namespace NullableBoolValue {
  export type AsObject = {
    isNull: boolean,
    value: boolean,
  }
}

