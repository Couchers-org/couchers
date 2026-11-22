import { useQuery } from "@tanstack/react-query";

import { CLUSTERED_MEMBERS_PATH } from "./constants";
import { clusterMembers, fetchMemberLocations } from "./mapData";

// Plain env read, so this doesn't pull in the full map library just for the URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Member clusters for the map, shared between the autoplay preload and the overlay. Grouped inside the query
 * function so only the coarse clusters are cached (and persisted to storage), never individual member locations.
 */
export function useMemberClusters(enabled: boolean) {
  return useQuery({
    queryKey: ["celebration100kClusters"],
    queryFn: async () => clusterMembers(await fetchMemberLocations(`${API_BASE_URL}${CLUSTERED_MEMBERS_PATH}`)),
    enabled,
    staleTime: Infinity,
  });
}
