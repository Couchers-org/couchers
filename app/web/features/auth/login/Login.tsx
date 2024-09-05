import { Divider, Typography } from "@material-ui/core";
import classNames from "classnames";
import Alert from "components/Alert";
import HtmlMeta from "components/HtmlMeta";
import StyledLink from "components/StyledLink";
import { Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useEffect } from "react";
import vercelLogo from "resources/vercel.svg";
import { dashboardRoute, signupRoute } from "routes";
import stringOrFirstString from "utils/stringOrFirstString";

import { useAuthContext } from "../AuthProvider";
import useAuthStyles from "../useAuthStyles";
import LoginForm from "./LoginForm";

export default function Login() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const { authState } = useAuthContext();
  const authenticated = authState.authenticated;
  const error = authState.error;

  const router = useRouter();
  const from = stringOrFirstString(router.query.from) ?? dashboardRoute;
  const redirectTo = from === "/" || from === "%2F" ? dashboardRoute : from;

  const authClasses = useAuthStyles();

  useEffect(() => {
    if (authenticated) {
      router.push(redirectTo);
    }
  }, [authenticated, router, redirectTo]);

  return (
    <>
      <HtmlMeta title={t("auth:login_page.title")} />
      <div className={classNames(authClasses.page, authClasses.pageBackground)}>
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
                <StyledLink href={signupRoute}>Sign up</StyledLink>
              </Trans>
            </Typography>
          </div>
        </div>
        {process.env.NEXT_PUBLIC_COUCHERS_ENV !== "prod" && (
          <a
            className={authClasses.vercelLink}
            rel="noopener noreferrer"
            href="https://vercel.com?utm_source=couchers-org&utm_campaign=oss"
          >
            <img alt={t("auth:vercel_logo_alt_text")} src={vercelLogo.src} />
          </a>
        )}
      </div>
    </>
  );
}
