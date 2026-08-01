import { useQuery } from "@tanstack/react-query";
import { GetMyVolunteerInfoRes } from "couchers/proto/account_pb";
import { volunteerInfoQueryKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { service } from "service";

export default function useVolunteerInfo() {
  const accountInfoQuery = useQuery<GetMyVolunteerInfoRes.AsObject, RpcError>({
    queryKey: [volunteerInfoQueryKey],
    queryFn: service.account.getMyVolunteerInfo,
  });

  return accountInfoQuery;
}
