import { useQuery } from "@tanstack/react-query";
import { accountInfoQueryKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { GetAccountInfoRes } from "proto/account_pb";
import { service } from "service";

export default function useAccountInfo({ enabled = true }: { enabled?: boolean } = {}) {
  const accountInfoQuery = useQuery<GetAccountInfoRes.AsObject, RpcError>({
    queryKey: [accountInfoQueryKey],
    queryFn: service.account.getAccountInfo,
    enabled,
  });

  return accountInfoQuery;
}
