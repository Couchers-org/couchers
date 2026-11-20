import { useQuery } from "@tanstack/react-query";
import { dashboardKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { GetDashboardRes } from "proto/screens_pb";
import { service } from "service";

// Items per page in the paged dashboard widgets. GetDashboard returns a few pages' worth per
// section, which the widgets page through locally.
export const DASHBOARD_PAGE_SIZE = 3;

/**
 * The dashboard's data, from a single GetDashboard request shared by every widget. Each widget
 * passes `select` to pick its section, and only re-renders when that section changes.
 */
export default function useGetDashboard<TData>(select: (dashboard: GetDashboardRes.AsObject) => TData) {
  return useQuery<GetDashboardRes.AsObject, RpcError, TData>({
    queryKey: [dashboardKey],
    queryFn: () => service.screens.getDashboard(),
    select,
  });
}
