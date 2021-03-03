import {
  BoolValue,
  StringValue,
  UInt32Value,
} from "google-protobuf/google/protobuf/wrappers_pb";
import {
  NullableBoolValue,
  NullableStringValue,
  NullableUInt32Value,
  RepeatedStringValue,
} from "pb/api_pb";

export type ProtoToJsTypes<T> = T extends StringValue.AsObject
  ? string
  : T extends RepeatedStringValue.AsObject
  ? string[]
  : T extends BoolValue.AsObject
  ? boolean
  : T extends NullableUInt32Value.AsObject
  ? number | null
  : T extends NullableBoolValue.AsObject
  ? boolean | null
  : T extends NullableStringValue.AsObject
  ? string | null
  : T extends UInt32Value.AsObject
  ? number
  : T;

export type SetMutationError = React.Dispatch<
  React.SetStateAction<string | null>
>;
