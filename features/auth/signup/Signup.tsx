import { Divider, Typography } from "@material-ui/core";
import * as Sentry from "@sentry/react";
import classNames from "classnames";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import HtmlMeta from "components/HtmlMeta";
import StyledLink from "components/StyledLink";
import MobileAuthBg from "features/auth/resources/mobile-auth-bg.jpg";
import CommunityGuidelinesForm from "features/auth/signup/CommunityGuidelinesForm";
import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Redirect, useHistory, useLocation, useParams } from "react-router-dom";
import CouchersLogo from "resources/CouchersLogo";
import { loginRoute, signupRoute, tosRoute } from "routes";
import { service } from "service";
import isGrpcError from "utils/isGrpcError";
import makeStyles from "utils/makeStyles";

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
    top: 0,
    bottom: 0,
    zIndex: 1,
    [theme.breakpoints.down("sm")]: {
      position: "absolute",
      background: `linear-gradient(rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 1)), url("${MobileAuthBg}")`,
    },
  },
  scrollingContent: {
    position: "relative",
    zIndex: 2,
    minHeight: "100vh",
    justifyContent: "center",
  },
  scrollingForm: {
    alignSelf: "flex-end",
    marginTop: theme.spacing(10),
    marginBottom: theme.spacing(4),
  },
}));

function CurrentForm() {
  const { t } = useTranslation(["auth", "global"]);
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
              <StyledLink to={loginRoute}>Log in</StyledLink>
            </Trans>
          </Typography>
        )}
        <BasicForm />
        <Typography variant="body1" className={classes.agreement}>
          <Trans i18nKey="auth:basic_sign_up_form.sign_up_agreement_explainer">
            By continuing, you agree to our{" "}
            <StyledLink to={tosRoute} target="_blank">
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
  const { t } = useTranslation(["auth", "global"]);
  const { authState, authActions } = useAuthContext();
  const authenticated = authState.authenticated;
  const error = authState.error;
  const authClasses = useAuthStyles();
  const classes = useStyles();
  const [loading, setLoading] = useState(false);

  const { urlToken } = useParams<{ urlToken: string }>();
  const location = useLocation();
  const history = useHistory();

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
          history.push(signupRoute);
          return;
        }
        setLoading(false);
      }
    })();
  }, [urlToken, authActions, location.pathname, history, t]);

  return (
    <>
      {authenticated && <Redirect to="/" />}
      <HtmlMeta title={t("global:sign_up")} />
      <div
        className={classNames(
          authClasses.page,
          classes.stickyPage,
          authClasses.pageBackground
        )}
      >
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
      </div>
    </>
  );
}
