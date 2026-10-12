import { useQueryClient } from "@tanstack/react-query";
import { dashboardKey } from "features/queryKeys";
import { GetDashboardRes } from "proto/screens_pb";
import { useCallback } from "react";
import { service } from "service";

/**
 * Returns a function that loads one section of the dashboard. Each widget loads its first page this
 * way: widgets asking at the same time share one in-flight GetDashboard request, so the dashboard
 * makes a single round trip. Later pages still come from each widget's own RPC.
 */
export default function useGetDashboardSection() {
  const queryClient = useQueryClient();
  return useCallback(
    async <Section extends keyof GetDashboardRes.AsObject>(
      section: Section,
    ): Promise<NonNullable<GetDashboardRes.AsObject[Section]>> => {
      const dashboard = await queryClient.query({
        queryKey: [dashboardKey],
        queryFn: () => service.dashboard.getDashboard(),
      });
      const value = dashboard[section];
      if (!value) throw new Error(`GetDashboard returned no ${section}`);
      return value;
    },
    [queryClient],
  );
}
