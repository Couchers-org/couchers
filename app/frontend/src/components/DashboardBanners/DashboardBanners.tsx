import { Link as MuiLink } from "@material-ui/core";
import { Alert as MuiAlert } from "@material-ui/lab/";
import Alert from "components/Alert";
import { Error as GrpcError } from "grpc-web";
import { GetAccountInfoRes } from "pb/account_pb";
import { accountInfoQueryKey } from "queryKeys";
import React from "react";
import { useQuery } from "react-query";
import { Link } from "react-router-dom";
import { editProfileRoute, settingsRoute } from "routes";
import { service } from "service";

import {
  CLICK_HERE_TO_EIDT,
  DONT_YOU_HATE,
  FILL_IN_WHO_I_AM,
  PASSWORD_TEXT_1,
  PASSWORD_TEXT_2,
  PASSWORD_TEXT_LINK,
  PLEASE_COMPLETE_PROFILE,
  UPLOAD_PHOTO,
} from "./constants";

export default function DashboardBanners() {
  const { data, error } = useQuery<GetAccountInfoRes.AsObject, GrpcError>(
    accountInfoQueryKey,
    service.account.getAccountInfo
  );

  return (
    <>
      {error && <Alert severity="error">{error?.message}</Alert>}
      {data && (
        <>
          {!data.profileComplete && (
            <>
              <MuiAlert severity="warning">
                {PLEASE_COMPLETE_PROFILE}
                <br />
                <br />
                {FILL_IN_WHO_I_AM}
                <br />
                {UPLOAD_PHOTO}
                <br />
                <br />
                <MuiLink component={Link} to={editProfileRoute}>
                  {CLICK_HERE_TO_EIDT}
                </MuiLink>
                <br />
                <br />
                {DONT_YOU_HATE}
              </MuiAlert>
              <br />
            </>
          )}
          {!data.hasPassword && (
            <>
              <MuiAlert severity="info">
                {PASSWORD_TEXT_1}{" "}
                <MuiLink component={Link} to={settingsRoute}>
                  {PASSWORD_TEXT_LINK}
                </MuiLink>{" "}
                {PASSWORD_TEXT_2}
              </MuiAlert>
              <br />
            </>
          )}
        </>
      )}
    </>
  );
}
