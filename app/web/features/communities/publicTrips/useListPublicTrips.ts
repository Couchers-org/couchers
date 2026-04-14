import { useQuery } from "@tanstack/react-query";
import { publicTripsKey } from "features/queryKeys";

// TODO: Replace with real types from proto once public_trips.proto is generated
export interface PublicTrip {
  tripId: number;
  userId: number;
  nodeId: number;
  fromDate: string;
  toDate: string;
  description: string;
  status: "searching_for_host" | "closed";
  created: string;
}

interface ListPublicTripsRes {
  publicTripsList: PublicTrip[];
  nextPageToken: string;
}

// TODO: Replace with real gRPC service call once backend PR is merged
async function listPublicTrips(
  communityId: number,
): Promise<ListPublicTripsRes> {
  return { publicTripsList: [], nextPageToken: "" };
}

export function useListPublicTrips(communityId: number) {
  return useQuery<ListPublicTripsRes>({
    queryKey: publicTripsKey(communityId),
    queryFn: () => listPublicTrips(communityId),
    enabled: !!communityId,
  });
}
