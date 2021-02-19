import { Error as GrpcError } from "grpc-web";
import { useQuery } from "react-query";

import { GetAccountInfoRes } from "../../pb/account_pb";
import { accountInfoQueryKey } from "../../queryKeys";
import { service } from "../../service";

export default function useAccountInfo() {
  const accountInfoQuery = useQuery<GetAccountInfoRes.AsObject, GrpcError>(
    accountInfoQueryKey,
    () => service.account.getAccountInfo()
  );

  return accountInfoQuery;
}
