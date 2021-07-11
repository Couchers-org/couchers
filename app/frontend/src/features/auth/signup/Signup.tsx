import {
  Divider,
  Hidden,
  Link as MuiLink,
  Typography,
} from "@material-ui/core";
import Alert from "components/Alert";
import AuthHeader from "components/AuthHeader";
import CircularProgress from "components/CircularProgress";
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
  SIGN_UP_HEADER,
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
  logIn: {
    marginTop: "auto",
    [theme.breakpoints.up("md")]: {
      color: theme.palette.common.white,
      lineHeight: "2.5",
      marginTop: 0,
    },
  },
  logInLink: {
    color: theme.palette.secondary.main,
    fontWeight: 700,
    [theme.breakpoints.up("md")]: {
      color: theme.palette.primary.main,
    },
  },
}));

function CurrentForm() {
  const classes = useStyles();
  const { authState } = useAuthContext();
  const state = authState.flowState;
  if (!state || state.needBasic) {
    return (
      <>
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
    return <AccountForm />;
  } else if (state.needFeedback) {
    return <FeedbackForm />;
  } else if (state.needVerifyEmail) {
    return <Typography variant="body1">{SIGN_UP_AWAITING_EMAIL}</Typography>;
  } else if (state.authRes) {
    return <Typography variant="body1">{SIGN_UP_REDIRECT}</Typography>;
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

  const flowState = authState.flowState;

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
      {/***** MOBILE ******/}
      <Hidden mdUp>
        <div className={authClasses.page}>
          <AuthHeader>{SIGN_UP_HEADER}</AuthHeader>
          {error && (
            <Alert className={authClasses.errorMessage} severity="error">
              {error}
            </Alert>
          )}
          {loading ? <CircularProgress /> : <CurrentForm />}
          {!flowState && (
            <Typography className={classes.logIn}>
              {ACCOUNT_ALREADY_CREATED + " "}
              <Link className={classes.logInLink} to={loginRoute}>
                {LOGIN}
              </Link>
            </Typography>
          )}
        </div>
      </Hidden>
      {/***** DESKTOP ******/}
      <Hidden smDown>
        <div className={authClasses.page}>
          <header className={authClasses.header}>
            <div className={authClasses.logoContainer}>
              <CouchersLogo />
              <div className={authClasses.logo}>{COUCHERS}</div>
            </div>
            {!flowState && (
              <Typography className={classes.logIn}>
                {ACCOUNT_ALREADY_CREATED + " "}
                <Link className={classes.logInLink} to={loginRoute}>
                  {LOGIN}
                </Link>
              </Typography>
            )}
          </header>
          <div className={authClasses.content}>
            <div className={authClasses.introduction}>
              <Typography classes={{ root: authClasses.title }} variant="h1">
                {INTRODUCTION_TITLE}
              </Typography>
              <Typography classes={{ root: authClasses.subtitle }} variant="h2">
                {INTRODUCTION_SUBTITLE}
                <Divider className={authClasses.underline}></Divider>
              </Typography>
            </div>
            <div className={authClasses.formWrapper}>
              {error && (
                <Alert className={authClasses.errorMessage} severity="error">
                  {error}
                </Alert>
              )}
              <AuthHeader>{SIGN_UP_HEADER}</AuthHeader>
              {loading ? <CircularProgress /> : <CurrentForm />}
            </div>
          </div>
        </div>
      </Hidden>
    </>
  );
}
