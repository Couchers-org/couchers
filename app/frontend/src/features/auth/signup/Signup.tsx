import { Divider, Link as MuiLink, Typography } from "@material-ui/core";
import classNames from "classnames";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import MobileAuthBg from "features/auth/resources/mobile-auth-bg.jpg";
import CommunityGuidelinesForm from "features/auth/signup/CommunityGuidelinesForm";
import { useEffect, useState } from "react";
import {
  Link,
  Redirect,
  useHistory,
  useLocation,
  useParams,
} from "react-router-dom";
import CouchersLogo from "resources/CouchersLogo";
import { loginRoute, signupRoute, tosRoute } from "routes";
import { service } from "service";
import makeStyles from "utils/makeStyles";

import { COUCHERS } from "../../../constants";
import { useAuthContext } from "../AuthProvider";
import {
  ACCOUNT_ALREADY_CREATED,
  INTRODUCTION_SUBTITLE,
  INTRODUCTION_TITLE,
  LOGIN,
  SIGN_UP_AGREEMENT,
  SIGN_UP_AWAITING_EMAIL,
  SIGN_UP_HEADER_ACCOUNT,
  SIGN_UP_HEADER_BASIC,
  SIGN_UP_HEADER_EMAIL,
  SIGN_UP_HEADER_FEEDBACK,
  SIGN_UP_HEADER_GUIDELINES,
  SIGN_UP_HEADER_REDIRECT,
  SIGN_UP_REDIRECT,
} from "../constants";
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
  },
  scrollingForm: {
    alignSelf: "flex-end",
    marginTop: theme.spacing(10),
    marginBottom: theme.spacing(4),
  },
}));

function CurrentForm() {
  const classes = useStyles();
  const { authState } = useAuthContext();
  const state = authState.flowState;
  if (!state || state.needBasic) {
    return (
      <>
        <Typography variant="h1" gutterBottom>
          {SIGN_UP_HEADER_BASIC}
        </Typography>
        {!state && (
          <Typography gutterBottom>
            {ACCOUNT_ALREADY_CREATED + " "}
            <MuiLink to={loginRoute} component={Link}>
              {LOGIN}
            </MuiLink>
          </Typography>
        )}
        <BasicForm />
        <Typography variant="body1" className={classes.agreement}>
          {SIGN_UP_AGREEMENT[0]}
          <MuiLink to={tosRoute} component={Link} target="_blank">
            {SIGN_UP_AGREEMENT[1]}
          </MuiLink>
          {SIGN_UP_AGREEMENT[2]}
        </Typography>
      </>
    );
  } else if (state.needAccount) {
    return (
      <>
        <Typography variant="h1" gutterBottom>
          {SIGN_UP_HEADER_ACCOUNT}
        </Typography>
        <AccountForm />
      </>
    );
  } else if (state.needAcceptCommunityGuidelines) {
    return (
      <>
        <Typography variant="h1" gutterBottom>
          {SIGN_UP_HEADER_GUIDELINES}
        </Typography>
        <CommunityGuidelinesForm />
      </>
    );
  } else if (state.needFeedback) {
    return (
      <>
        <Typography variant="h1" gutterBottom>
          {SIGN_UP_HEADER_FEEDBACK}
        </Typography>
        <FeedbackForm />
      </>
    );
  } else if (state.needVerifyEmail) {
    return (
      <>
        <Typography variant="h1" gutterBottom>
          {SIGN_UP_HEADER_EMAIL}
        </Typography>
        <Typography variant="body1">{SIGN_UP_AWAITING_EMAIL}</Typography>
      </>
    );
  } else if (state.authRes) {
    return (
      <>
        <Typography variant="h1" gutterBottom>
          {SIGN_UP_HEADER_REDIRECT}
        </Typography>
        <Typography variant="body1">{SIGN_UP_REDIRECT}</Typography>
      </>
    );
  } else {
    throw Error("Unhandled signup flow state.");
  }
}

export default function Signup() {
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
          authActions.authError(err.message);
          history.push(signupRoute);
          return;
        }
        setLoading(false);
      }
    })();
  }, [urlToken, authActions, location.pathname, history]);

  return (
    <>
      {authenticated && <Redirect to="/" />}
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
            <div className={authClasses.logo}>{COUCHERS}</div>
          </div>
        </header>
        <div className={authClasses.content}>
          <div className={authClasses.introduction}>
            <Typography
              classes={{ root: authClasses.title }}
              variant="h1"
              component="span"
            >
              {INTRODUCTION_TITLE}
            </Typography>
            <Typography
              classes={{ root: authClasses.subtitle }}
              variant="h2"
              component="span"
            >
              {INTRODUCTION_SUBTITLE}
              <Divider className={authClasses.underline}></Divider>
            </Typography>
          </div>
          <div style={{ width: "100%" }}></div>
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
