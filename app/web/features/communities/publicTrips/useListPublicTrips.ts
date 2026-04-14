import { useQuery } from "@tanstack/react-query";
import { publicTripsKey } from "features/queryKeys";
import publicTripsFixture from "test/fixtures/publicTrips.json";

// TODO: Replace with real types from proto once public_trips.proto is generated
export interface PublicTripUser {
  userId: number;
  isGhost: boolean;
  username: string;
  name: string;
  city: string;
  age: number;
  avatarUrl: string;
  avatarThumbnailUrl: string;
  lat: number;
  lng: number;
  radius: number;
  hasStrongVerification: boolean;
}

export interface PublicTrip {
  tripId: number;
  user: PublicTripUser;
  nodeId: number;
  fromDate: string;
  toDate: string;
  description: string;
  status: string;
  created: string;
}

export interface ListPublicTripsRes {
  publicTripsList: PublicTrip[];
  nextPageToken: string;
  totalPages: number;
}

const PAGE_SIZE = 3; // Change to 10 before final implementation, set low for easier testing of pagination in UI

// TODO: Replace with real gRPC service call once backend PR is merged
async function listPublicTrips(
  communityId: number,
  page: number,
): Promise<ListPublicTripsRes> {
  const allTrips = publicTripsFixture as PublicTrip[];
  const totalPages = Math.ceil(allTrips.length / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const pageTrips = allTrips.slice(start, start + PAGE_SIZE);
  const hasMore = start + PAGE_SIZE < allTrips.length;
  return {
    publicTripsList: pageTrips,
    nextPageToken: hasMore ? String(page + 1) : "",
    totalPages,
  };
}

export function useListPublicTrips(communityId: number, page: number = 0) {
  return useQuery<ListPublicTripsRes>({
    queryKey: [...publicTripsKey(communityId), page],
    queryFn: () => listPublicTrips(communityId, page),
    enabled: !!communityId,
  });
}
