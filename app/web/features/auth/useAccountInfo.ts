import { useQuery } from "@tanstack/react-query";
import { GetAccountInfoRes } from "couchers/proto/account_pb";
import { accountInfoQueryKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { service } from "service";

export default function useAccountInfo() {
  const accountInfoQuery = useQuery<GetAccountInfoRes.AsObject, RpcError>({
    queryKey: [accountInfoQueryKey],
    queryFn: service.account.getAccountInfo,
  });

  return accountInfoQuery;
}
