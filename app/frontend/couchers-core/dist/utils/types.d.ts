/// <reference types="react" />
import { NullableBoolValue, NullableStringValue, NullableUInt32Value, RepeatedStringValue } from "couchers-core/src/proto/api_pb";
import { BoolValue, StringValue, UInt32Value } from "google-protobuf/google/protobuf/wrappers_pb";
export declare type ProtoToJsTypes<T> = T extends StringValue.AsObject ? string : T extends RepeatedStringValue.AsObject ? string[] : T extends BoolValue.AsObject ? boolean : T extends NullableUInt32Value.AsObject ? number | null : T extends NullableBoolValue.AsObject ? boolean | null : T extends NullableStringValue.AsObject ? string | null : T extends UInt32Value.AsObject ? number : T;
export declare type SetMutationError = React.Dispatch<React.SetStateAction<string | null>>;
//# sourceMappingURL=types.d.ts.map