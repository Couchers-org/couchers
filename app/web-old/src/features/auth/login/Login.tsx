import { Divider, Typography } from "@material-ui/core";
import classNames from "classnames";
import StyledLink from "components/StyledLink";
import { useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Redirect, useLocation, useParams } from "react-router-dom";
import CouchersLogo from "resources/CouchersLogo";
import makeStyles from "utils/makeStyles";

import Alert from "../../../components/Alert";
import HtmlMeta from "../../../components/HtmlMeta";
import { signupRoute } from "../../../routes";
import { useAuthContext } from "../AuthProvider";
import useAuthStyles from "../useAuthStyles";
import LoginForm from "./LoginForm";

const useStyles = makeStyles((theme) => ({}));

export default function Login() {
  const { t } = useTranslation(["auth", "global"]);
  const { authState, authActions } = useAuthContext();
  const authenticated = authState.authenticated;
  const error = authState.error;

  const location = useLocation<undefined | { from: Location }>();
  const redirectTo = location.state?.from?.pathname || "/";
  const { urlToken } = useParams<{ urlToken: string }>();

  const authClasses = useAuthStyles();
  const classes = useStyles();

  useEffect(() => {
    // check for a login token
    if (urlToken) {
      authActions.tokenLogin(urlToken);
    }
  }, [urlToken, authActions]);

  return (
    <>
      <HtmlMeta title={t("auth:login_page.title")} />
      {authenticated && <Redirect to={redirectTo} />}
      <div className={classNames(authClasses.page, authClasses.pageBackground)}>
        <header className={authClasses.header}>
          <div className={authClasses.logoContainer}>
            <CouchersLogo />
            <div className={authClasses.logo}>{t("global:couchers")}</div>
          </div>
        </header>
        <div className={authClasses.content}>
          <div className={authClasses.introduction}>
            <Typography
              classes={{ root: authClasses.title }}
              variant="h1"
              component="span"
            >
              {t("auth:introduction_title")}
            </Typography>
            <Typography
              classes={{ root: authClasses.subtitle }}
              variant="h2"
              component="span"
            >
              {t("auth:introduction_subtitle")}
              <Divider className={authClasses.underline}></Divider>
            </Typography>
          </div>
          <div className={authClasses.formWrapper}>
            <Typography variant="h1" gutterBottom>
              {t("auth:login_page.header")}
            </Typography>
            {error && (
              <Alert className={authClasses.errorMessage} severity="error">
                {error}
              </Alert>
            )}
            <LoginForm />
            <Typography>
              <Trans t={t} i18nKey="auth:login_page.no_account_prompt">
                No account yet?{" "}
                <StyledLink to={signupRoute}>Sign up</StyledLink>
              </Trans>
            </Typography>
          </div>
        </div>
      </div>
    </>
  );
}
