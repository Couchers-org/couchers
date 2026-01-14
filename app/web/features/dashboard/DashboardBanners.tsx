import { Alert as MuiAlert, styled, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import Alert from "components/Alert";
import { accountInfoQueryKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import { GetAccountInfoRes } from "proto/account_pb";
import React from "react";
import { service } from "service";
import { theme } from "theme";

import ReminderCarousel from "./ReminderCarousel";

const StyledAlert = styled(MuiAlert)(() => ({
  marginBottom: theme.spacing(2),
}));

export default function DashboardBanners() {
  const { t } = useTranslation([DASHBOARD]);

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
            // <StyledAlert severity="warning">
            //   <Typography
            //     variant="inherit"
            //     sx={{
            //       marginBottom: "16px",
            //     }}
            //   >
            //     {t("dashboard:please_complete_profile")}
            //   </Typography>
            //   <Typography variant="inherit">
            //     {t("dashboard:fill_in_who_i_am")}
            //   </Typography>
            //   <Typography
            //     variant="inherit"
            //     sx={{
            //       marginBottom: "16px",
            //     }}
            //   >
            //     {t("dashboard:upload_photo")}
            //   </Typography>
            //   <Typography
            //     variant="inherit"
            //     sx={{
            //       marginBottom: "16px",
            //     }}
            //   >
            //     <Button
            //       component={Link}
            //       role="link"
            //       href={routeToEditProfile()}
            //     >
            //       {t("dashboard:edit_profile_button_text")}
            //     </Button>
            //   </Typography>
            //   <Typography variant="inherit">
            //     {t("dashboard:complete_profile_explanation")}
            //   </Typography>
            // </StyledAlert>
            <Typography variant="inherit">
              <ReminderCarousel />
            </Typography>
          )}
        </>
      )}
    </>
  );
}
