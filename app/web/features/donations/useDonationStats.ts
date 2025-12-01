import { useQuery } from "@tanstack/react-query";
import { donationStatsKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { GetDonationStatsRes } from "proto/public_pb";
import { service } from "service";

export default function useDonationStats() {
  return useQuery<GetDonationStatsRes.AsObject, RpcError>({
    queryKey: [donationStatsKey],
    queryFn: service.publicApi.getDonationStats,
    // Cache for 5 minutes
    // staleTime: 5 * 60 * 1000,
  });
}
