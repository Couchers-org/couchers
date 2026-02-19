import { Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import Alert from "components/Alert";
import { accountInfoQueryKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { GetAccountInfoRes } from "proto/account_pb";
import React from "react";
import { service } from "service";

import ReminderCarousel from "./ReminderCarousel";

export default function DashboardBanners() {
  const { data, error } = useQuery<GetAccountInfoRes.AsObject, RpcError>({
    queryKey: [accountInfoQueryKey],
    queryFn: service.account.getAccountInfo,
  });

  return (
    <>
      {error && <Alert severity="error">{error?.message}</Alert>}
      {data && (
        <>
          {!data.profileComplete && (
            <Typography variant="inherit">
              <ReminderCarousel />
            </Typography>
          )}
        </>
      )}
    </>
  );
}
