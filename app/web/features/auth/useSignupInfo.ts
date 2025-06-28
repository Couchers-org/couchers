import { signupInfoQueryKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { GetSignupPageInfoRes } from "proto/public_pb";
import { useQuery } from "react-query";
import { service } from "service";

export default function useSignupInfo() {
  const { data, error, isLoading } = useQuery<
    GetSignupPageInfoRes.AsObject,
    RpcError
  >(signupInfoQueryKey, service.publicApi.getSignupPageInfo);

  console.log(
    "USE SIGNUP INFO DATA:",
    data,
    "ERROR:",
    error,
    "LOADING:",
    isLoading,
  );

  return data;
}
