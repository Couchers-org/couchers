import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import ChangeEmail from "features/auth/email/ChangeEmail";
import DoNotEmail from "features/auth/email/DoNotEmail";
import { ChangePassword } from "features/auth/password";
import Section from "features/auth/section/Section";
import Timezone from "features/auth/timezone/Timezone";
import Username from "features/auth/username/Username";
import { useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import makeStyles from "utils/makeStyles";

import DeleteAccount from "./deletion/DeleteAccount";
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
  const { t } = useTranslation(AUTH);
  const {
    data: accountInfo,
    error: accountInfoError,
    isLoading: isAccountInfoLoading,
  } = useAccountInfo();

  const classes = useStyles();

  return (
    <>
      <HtmlMeta title={t("account_settings_page.title")} />
      <PageTitle>{t("account_settings_page.title")}</PageTitle>
      <Section
        className={classes.section}
        title={t("account_settings_page.gender_section.title")}
        content={t("account_settings_page.gender_section.explanation")}
      />
      <Section
        className={classes.section}
        title={t("account_settings_page.birth_date_section.title")}
        content={t("account_settings_page.birth_date_section.explanation")}
      />
      {isAccountInfoLoading ? (
        <CircularProgress />
      ) : accountInfoError ? (
        <Alert severity="error">{accountInfoError.message}</Alert>
      ) : accountInfo ? (
        <>
          <Username
            className={classes.section}
            username={accountInfo.username}
          />
          <Timezone
            className={classes.section}
            timezone={accountInfo.timezone}
          />
          <ChangeEmail
            className={classes.section}
            email={accountInfo.email}
            hasPassword={accountInfo.hasPassword}
          />
          <DoNotEmail className={classes.section} />
          <ChangePassword
            className={classes.section}
            hasPassword={accountInfo.hasPassword}
          />
          <DeleteAccount
            className={classes.section}
            username={accountInfo.username}
          />
        </>
      ) : null}
    </>
  );
}
