import Alert from "components/Alert";
import { GetDashboardBannersRes } from "pb/account_pb";
import { dashboardBannersKey } from "queryKeys";
import React from "react";
import { useQuery } from "react-query";
import { service } from "service";

export default function DashboardBanners() {
  const { data, error: queryError } = useQuery<
    GetDashboardBannersRes.AsObject,
    Error
  >(dashboardBannersKey, service.account.getDashboardBanners);

  return (
    <>
      {queryError && <Alert severity="error">{queryError?.message}</Alert>}
      {data && (
        <>
          {data.bannersList.map((banner) => (
            <Alert severity={banner.severity as any}>{banner.text}</Alert>
          ))}
        </>
      )}
    </>
  );
}
