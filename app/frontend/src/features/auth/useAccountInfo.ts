import { Error as GrpcError } from "grpc-web";
import { GetAccountInfoRes } from "pb/account_pb";
import { accountInfoQueryKey } from "queryKeys";
import { useQuery } from "react-query";
import { service } from "service/index";

export default function useAccountInfo() {
  const accountInfoQuery = useQuery<GetAccountInfoRes.AsObject, GrpcError>(
    accountInfoQueryKey,
    () => service.account.getAccountInfo()
  );

  return accountInfoQuery;
}
