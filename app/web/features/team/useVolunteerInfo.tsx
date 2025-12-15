import { useQuery } from "@tanstack/react-query";
import { volunteerInfoQueryKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { GetMyVolunteerInfoRes } from "proto/account_pb";
import { service } from "service";

export default function useVolunteerInfo() {
  const accountInfoQuery = useQuery<GetMyVolunteerInfoRes.AsObject, RpcError>({
    queryKey: [volunteerInfoQueryKey],
    queryFn: service.account.getMyVolunteerInfo,
  });

  return accountInfoQuery;
}
