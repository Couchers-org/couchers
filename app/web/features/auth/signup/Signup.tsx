import { Divider, Typography } from "@material-ui/core";
import * as Sentry from "@sentry/react";
import classNames from "classnames";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import HtmlMeta from "components/HtmlMeta";
import Redirect from "components/Redirect";
import StyledLink from "components/StyledLink";
import MobileAuthBg from "features/auth/resources/mobile-auth-bg.jpg";
import CommunityGuidelinesForm from "features/auth/signup/CommunityGuidelinesForm";
import { Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import vercelLogo from "resources/vercel.svg";
import { dashboardRoute, loginRoute, signupRoute, tosRoute } from "routes";
import { service } from "service";
import isGrpcError from "utils/isGrpcError";
import makeStyles from "utils/makeStyles";
import stringOrFirstString from "utils/stringOrFirstString";

import { useAuthContext } from "../AuthProvider";
import useAuthStyles from "../useAuthStyles";
import AccountForm from "./AccountForm";
import BasicForm from "./BasicForm";
import FeedbackForm from "./FeedbackForm";

const useStyles = makeStyles((theme) => ({
  agreement: {
    textAlign: "center",
    [theme.breakpoints.up("md")]: {
      marginTop: theme.spacing(3),
      textAlign: "left",
    },
  },
  stickyPage: {
    position: "fixed",
    left: 0,
    right: 0,
    top: theme.shape.navPaddingXs,
    [theme.breakpoints.up("sm")]: {
      top: theme.shape.navPaddingSmUp,
    },
    bottom: 0,
    zIndex: 1,
    [theme.breakpoints.down("sm")]: {
      position: "absolute",
      background: `linear-gradient(rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 1)), url("${MobileAuthBg.src}")`,
    },
  },
  scrollingContent: {
    position: "relative",
    zIndex: 2,
    justifyContent: "center",
    minHeight: `calc(100vh - ${theme.shape.navPaddingXs})`,
    [theme.breakpoints.up("sm")]: {
      minHeight: `calc(100vh - ${theme.shape.navPaddingSmUp})`,
    },
  },
  scrollingForm: {
    flexGrow: 1,
    alignSelf: "flex-start",
    marginTop: theme.spacing(10),
    marginBottom: theme.spacing(4),
    [theme.breakpoints.up("md")]: {
      alignSelf: "flex-end",
    },
    [theme.breakpoints.down("sm")]: {
      width: "100%",
    },
  },
}));

function CurrentForm() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const classes = useStyles();
  const { authState } = useAuthContext();
  const state = authState.flowState;
  if (!state || state.needBasic) {
    return (
      <>
        <Typography variant="h1" gutterBottom>
          {t("auth:basic_sign_up_form.header")}
        </Typography>
        {!state && (
          <Typography gutterBottom>
            <Trans i18nKey="auth:basic_sign_up_form.existing_user_prompt">
              Already have an account?{" "}
              <StyledLink href={loginRoute}>Log in</StyledLink>
            </Trans>
          </Typography>
        )}
        <BasicForm />
        <Typography variant="body1" className={classes.agreement}>
          <Trans i18nKey="auth:basic_sign_up_form.sign_up_agreement_explainer">
            By continuing, you agree to our{" "}
            <StyledLink href={tosRoute} target="_blank">
              Terms of Service
            </StyledLink>
            , including our cookie, email, and data handling policies.
          </Trans>
        </Typography>
      </>
    );
  } else if (state.needAccount) {
    return (
      <>
        <Typography variant="h1" gutterBottom>
          {t("auth:account_form.header")}
        </Typography>
        <AccountForm />
      </>
    );
  } else if (state.needAcceptCommunityGuidelines) {
    return (
      <>
        <Typography variant="h1" gutterBottom>
          {t("auth:community_guidelines_form.header")}
        </Typography>
        <CommunityGuidelinesForm />
      </>
    );
  } else if (state.needFeedback) {
    return (
      <>
        <Typography variant="h1" gutterBottom>
          {t("auth:feedback_form.header")}
        </Typography>
        <FeedbackForm />
      </>
    );
  } else if (state.needVerifyEmail) {
    return (
      <>
        <Typography variant="h1" gutterBottom>
          {t("auth:sign_up_completed_title")}
        </Typography>
        <Typography variant="body1">
          {t("auth:sign_up_completed_prompt")}
        </Typography>
      </>
    );
  } else if (state.authRes) {
    return (
      <>
        <Typography variant="h1" gutterBottom>
          {t("auth:sign_up_completed_title")}
        </Typography>
        <Typography variant="body1">
          {t("auth:sign_up_confirmed_prompt")}
        </Typography>
      </>
    );
  } else {
    throw Error(t("auth:unhandled_sign_up_state"));
  }
}

export default function Signup() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const { authState, authActions } = useAuthContext();
  const authenticated = authState.authenticated;
  const error = authState.error;
  const authClasses = useAuthStyles();
  const classes = useStyles();
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const urlToken = stringOrFirstString(router.query.token);

  useEffect(() => {
    authActions.clearError();
  }, [authActions]);

  useEffect(() => {
    if (authState.error) window.scroll({ top: 0, behavior: "smooth" });
  }, [authState.error]);

  useEffect(() => {
    (async () => {
      if (urlToken) {
        setLoading(true);
        try {
          authActions.updateSignupState(
            await service.auth.signupFlowEmailToken(urlToken)
          );
        } catch (err) {
          Sentry.captureException(err, {
            tags: {
              component: "auth/signup/Signup",
            },
          });
          authActions.authError(
            isGrpcError(err) ? err.message : t("global:fatal_error_message")
          );
          router.push(signupRoute);
          return;
        }
        setLoading(false);
      }
    })();
    // next-router-mock router isn't memoized, so putting router in the dependencies
    // causes infinite looping in tests
  }, [urlToken, authActions, t]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {authenticated && <Redirect to={dashboardRoute} />}
      <HtmlMeta title={t("global:sign_up")} />
      <div
        className={classNames(
          authClasses.page,
          classes.stickyPage,
          authClasses.pageBackground
        )}
      >
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
          <div
            style={{
              //this div is to match the flex layout on the login page
              width: "45%",
            }}
          ></div>
        </div>
      </div>
      <div className={classNames(authClasses.page, classes.scrollingContent)}>
        <div
          className={classNames(authClasses.formWrapper, classes.scrollingForm)}
        >
          {error && (
            <Alert className={authClasses.errorMessage} severity="error">
              {error}
            </Alert>
          )}
          {loading ? <CircularProgress /> : <CurrentForm />}
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
