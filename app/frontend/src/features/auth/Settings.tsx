import { Typography } from "@material-ui/core";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import PageTitle from "components/PageTitle";
import ChangeEmail from "features/auth/email/ChangeEmail";
import { ChangePassword } from "features/auth/password";
import { GetAccountInfoRes } from "proto/account_pb";
import React from "react";

import { CHANGE_NAME_GENDER, CONTACT } from "./constants";
import useAccountInfo from "./useAccountInfo";

export default function Settings() {
  const {
    data: accountInfo,
    error: accountInfoError,
    isLoading: isAccountInfoLoading,
  } = useAccountInfo();

  return (
    <>
      <PageTitle>{CHANGE_NAME_GENDER}</PageTitle>
      <Typography variant="body1">{CONTACT}</Typography>
      {isAccountInfoLoading ? (
        <CircularProgress />
      ) : accountInfoError ? (
        <Alert severity="error">{accountInfoError.message}</Alert>
      ) : (
        <>
          <ChangeEmail {...(accountInfo as GetAccountInfoRes.AsObject)} />
          <ChangePassword {...(accountInfo as GetAccountInfoRes.AsObject)} />
        </>
      )}
    </>
  );
}
