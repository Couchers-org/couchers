import { accountInfoQueryKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { GetAccountInfoRes } from "proto/account_pb";
import { useQuery } from "react-query";
import { service } from "service";

export default function useAccountInfo() {
  const accountInfoQuery = useQuery<GetAccountInfoRes.AsObject, RpcError>(
    accountInfoQueryKey,
    service.account.getAccountInfo
  );

  return accountInfoQuery;
}
