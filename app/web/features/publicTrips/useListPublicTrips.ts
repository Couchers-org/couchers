import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { publicTripsBaseKey, publicTripsByUserBaseKey, publicTripsByUserKey, publicTripsKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import {
  ListPublicTripsByUserRes,
  ListPublicTripsRes,
  PublicTrip as PublicTripPb,
  PublicTripStatus,
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

export function useListPublicTripsByUser({
  userId,
  pageToken,
  ascending,
}: {
  userId: number;
  pageToken: string;
  ascending?: boolean;
}) {
  return useQuery<ListPublicTripsByUserRes.AsObject, RpcError>({
    queryKey: [...publicTripsByUserKey(userId), pageToken, ascending],
    queryFn: () =>
      service.publicTrips.listPublicTripsByUser({
        userId,
        pageToken: pageToken || undefined,
        pageSize: PAGE_SIZE,
        ascending,
      }),
    enabled: !!userId,
  });
}

export function useCreatePublicTrip(communityId: number, onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation<
    PublicTripPb.AsObject,
    RpcError,
    {
      communityId: number;
      fromDate: string;
      toDate: string;
      description: string;
      sameGenderOnly: boolean;
    }
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

export function useUpdatePublicTrip(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation<
    PublicTripPb.AsObject,
    RpcError,
    {
      tripId: number;
      fromDate?: string;
      toDate?: string;
      description?: string;
      status?: PublicTripStatus;
      sameGenderOnly?: boolean;
    }
  >({
    mutationFn: (input) => service.publicTrips.updatePublicTrip(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [publicTripsBaseKey] });
      queryClient.invalidateQueries({ queryKey: [publicTripsByUserBaseKey] });
      onSuccess?.();
    },
  });
}
