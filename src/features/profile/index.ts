import { ProtoToJsTypes } from "../../utils/types";
import { UpdateProfileReq } from "../../pb/api_pb";

export * from "./actions";

type RequiredUpdateProfileReq = Required<UpdateProfileReq.AsObject>;
export type ProfileFormData = {
  [K in keyof RequiredUpdateProfileReq]-?: ProtoToJsTypes<
    RequiredUpdateProfileReq[K]
  >;
};
