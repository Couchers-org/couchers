import { Typography } from "@material-ui/core";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import PageTitle from "components/PageTitle";
import ChangeEmail from "features/auth/email/ChangeEmail";
import { ChangePassword } from "features/auth/password";
import Timezone from "features/auth/timezone/Timezone";
import Username from "features/auth/username/Username";
import { GetAccountInfoRes } from "proto/account_pb";

import { ACCOUNT_SETTINGS, CHANGE_NAME_GENDER, CONTACT } from "./constants";
import useAccountInfo from "./useAccountInfo";

export default function Settings() {
  const {
    data: accountInfo,
    error: accountInfoError,
    isLoading: isAccountInfoLoading,
  } = useAccountInfo();

  return (
    <>
      <PageTitle>{ACCOUNT_SETTINGS}</PageTitle>
      <Typography variant="h2">{CHANGE_NAME_GENDER}</Typography>
      <Typography variant="body1">{CONTACT}</Typography>
      {isAccountInfoLoading ? (
        <CircularProgress />
      ) : accountInfoError ? (
        <Alert severity="error">{accountInfoError.message}</Alert>
      ) : (
        <>
          <Username {...(accountInfo as GetAccountInfoRes.AsObject)} />
          <Timezone {...(accountInfo as GetAccountInfoRes.AsObject)} />
          <ChangeEmail {...(accountInfo as GetAccountInfoRes.AsObject)} />
          <ChangePassword {...(accountInfo as GetAccountInfoRes.AsObject)} />
        </>
      )}
    </>
  );
}
