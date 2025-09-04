import { useQuery } from "@tanstack/react-query";
import { RpcError } from "grpc-web";

import { accountInfoQueryKey } from "@/features/queryKeys";
import { GetAccountInfoRes } from "@/proto/account_pb";
import { service } from "@/service";

export default function useAccountInfo() {
  const accountInfoQuery = useQuery<GetAccountInfoRes.AsObject, RpcError>({
    queryKey: [accountInfoQueryKey],
    queryFn: service.account.getAccountInfo,
  });

  return accountInfoQuery;
}
