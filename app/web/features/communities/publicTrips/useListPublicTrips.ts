import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { publicTripsKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import {
  ListPublicTripsRes,
  PublicTrip as PublicTripPb,
} from "proto/public_trips_pb";
import { service } from "service";

export type PublicTrip = PublicTripPb.AsObject;

const PAGE_SIZE = 10;

export function useListPublicTrips(communityId: number, pageToken: string) {
  return useQuery<ListPublicTripsRes.AsObject, RpcError>({
    queryKey: [...publicTripsKey(communityId), pageToken],
    queryFn: () =>
      service.publicTrips.listPublicTrips({
        communityId,
        pageToken: pageToken || undefined,
        pageSize: PAGE_SIZE,
      }),
    enabled: !!communityId,
  });
}

export function useCreatePublicTrip(
  communityId: number,
  onSuccess?: () => void,
) {
  const queryClient = useQueryClient();
  return useMutation<
    PublicTripPb.AsObject,
    RpcError,
    { nodeId: number; fromDate: string; toDate: string; description: string }
  >({
    mutationFn: (input) => service.publicTrips.createPublicTrip(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: publicTripsKey(communityId),
      });
      onSuccess?.();
    },
  });
}
