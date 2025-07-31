import { volunteerInfoQueryKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { GetMyVolunteerInfoRes } from "proto/account_pb";
import { useQuery } from "react-query";
import { service } from "service";

export default function useVolunteerInfo() {
  const accountInfoQuery = useQuery<GetMyVolunteerInfoRes.AsObject, RpcError>(
    volunteerInfoQueryKey,
    service.account.getMyVolunteerInfo,
  );

  return accountInfoQuery;
}
