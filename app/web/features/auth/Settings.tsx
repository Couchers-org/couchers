import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import ChangeEmail from "features/auth/email/ChangeEmail";
import { ChangePassword } from "features/auth/password";
import Section from "features/auth/section/Section";
import Timezone from "features/auth/timezone/Timezone";
import Username from "features/auth/username/Username";
import { GetAccountInfoRes } from "proto/account_pb";
import makeStyles from "utils/makeStyles";

import {
  ACCOUNT_SETTINGS,
  CHANGE_BIRTHDATE,
  CHANGE_BIRTHDATE_CONTACT,
  CHANGE_GENDER,
  CHANGE_GENDER_CONTACT,
} from "./constants";
import useAccountInfo from "./useAccountInfo";

const useStyles = makeStyles((theme) => ({
  section: {
    margin: theme.spacing(4, 0),
    "&:first-of-type": {
      marginTop: theme.spacing(2),
    },
  },
}));

export default function Settings() {
  const {
    data: accountInfo,
    error: accountInfoError,
    isLoading: isAccountInfoLoading,
  } = useAccountInfo();

  const classes = useStyles();

  return (
    <>
      <HtmlMeta title={ACCOUNT_SETTINGS} />
      <PageTitle>{ACCOUNT_SETTINGS}</PageTitle>
      <Section
        className={classes.section}
        title={CHANGE_GENDER}
        content={CHANGE_GENDER_CONTACT}
      />
      <Section
        className={classes.section}
        title={CHANGE_BIRTHDATE}
        content={CHANGE_BIRTHDATE_CONTACT}
      />
      {isAccountInfoLoading ? (
        <CircularProgress />
      ) : accountInfoError ? (
        <Alert severity="error">{accountInfoError.message}</Alert>
      ) : accountInfo ? (
        <>
          <Username
            className={classes.section}
            {...(accountInfo as GetAccountInfoRes.AsObject)}
          />
          <Timezone
            className={classes.section}
            timezone={accountInfo.timezone}
          />
          <ChangeEmail
            className={classes.section}
            {...(accountInfo as GetAccountInfoRes.AsObject)}
          />
          <ChangePassword
            className={classes.section}
            {...(accountInfo as GetAccountInfoRes.AsObject)}
          />
        </>
      ) : null}
    </>
  );
}
