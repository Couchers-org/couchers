import { GetAccountInfoRes } from "couchers-core/src/proto/account_pb";
import { service } from "couchers-core/dist/service";
import { Error as GrpcError } from "grpc-web";
import { accountInfoQueryKey } from "queryKeys";
import { useQuery } from "react-query";

export default function useAccountInfo() {
  const accountInfoQuery = useQuery<GetAccountInfoRes.AsObject, GrpcError>(
    accountInfoQueryKey,
    service.account.getAccountInfo
  );

  return accountInfoQuery;
}
