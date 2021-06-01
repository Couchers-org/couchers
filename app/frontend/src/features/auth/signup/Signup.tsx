import { Divider, Hidden, Typography } from "@material-ui/core";
import CircularProgress from "components/CircularProgress";
import { SignupFlowRes } from "pb/auth_pb";
import { useEffect, useState } from "react";
import {
  Link,
  Redirect,
  useHistory,
  useLocation,
  useParams,
} from "react-router-dom";
import CouchersLogo from "resources/CouchersLogo";
import { service } from "service";
import makeStyles from "utils/makeStyles";

import Alert from "../../../components/Alert";
import AuthHeader from "../../../components/AuthHeader";
import { COUCHERS } from "../../../constants";
import { loginRoute, signupRoute } from "../../../routes";
import { useAuthContext } from "../AuthProvider";
import {
  ACCOUNT_ALREADY_CREATED,
  INTRODUCTION_SUBTITLE,
  INTRODUCTION_TITLE,
  LOGIN,
  SIGN_UP_AGREEMENT,
  SIGN_UP_HEADER,
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

type ScreenType = "basic" | "account" | "feedback" | "email";

export interface SignupFormProps {
  token: string;
  callback: (state: SignupFlowRes.AsObject) => void;
}

interface CurrentFormProps extends SignupFormProps {
  screen: ScreenType;
}

function CurrentForm({ screen, token, callback }: CurrentFormProps) {
  const classes = useStyles();

  switch (screen) {
    case "basic":
      return (
        <>
          <BasicForm callback={callback} />
          <Typography variant="body1" className={classes.agreement}>
            {SIGN_UP_AGREEMENT}
          </Typography>
        </>
      );
    case "account":
      return <AccountForm token={token} callback={callback} />;
    case "feedback":
      return <FeedbackForm token={token} callback={callback} />;
    case "email":
      return (
        <>
          To finish signing up, please verify your email by following the link
          we sent you.
        </>
      );
  }
}

export default function Signup() {
  const { authState, authActions } = useAuthContext();
  const authenticated = authState.authenticated;
  const error = authState.error;
  const authClasses = useAuthStyles();
  const classes = useStyles();
  const [loading, setLoading] = useState(false);

  const [flowState, setFlowState] = useState<SignupFlowRes.AsObject>();

  const [token, setToken] = useState("");
  const [screen, setScreen] = useState<ScreenType>("basic");

  useEffect(() => {
    authActions.clearError();
  }, [authActions]);

  const { urlToken } = useParams<{ urlToken: string }>();
  const location = useLocation();
  const history = useHistory();

  const callback = (state: SignupFlowRes.AsObject) => {
    setFlowState(state);
    if (state.needBasic) {
      // shouldn't happen
      console.error("Got state 'basic' in callback...");
      setScreen("basic");
      return;
    }
    if (state.success) {
      authActions.firstLogin(state.authRes!);
      return;
    }
    setToken(state.flowToken);
    if (state.needAccount) {
      setScreen("account");
      return;
    } else if (state.needFeedback) {
      setScreen("feedback");
      return;
    } else if (state.needVerifyEmail) {
      setScreen("email");
      return;
    }
    console.error("Fell through callback?");
  };

  useEffect(() => {
    (async () => {
      if (urlToken) {
        setLoading(true);
        try {
          const res = await service.auth.signupFlowVerifyEmail(urlToken);
          callback(res);
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
      {JSON.stringify(flowState)}
      {/***** MOBILE ******/}
      <Hidden mdUp>
        <div className={authClasses.page}>
          <AuthHeader>{SIGN_UP_HEADER}</AuthHeader>
          {error && (
            <Alert className={authClasses.errorMessage} severity="error">
              {error}
            </Alert>
          )}
          {loading ? (
            <CircularProgress />
          ) : (
            <CurrentForm screen={screen} token={token} callback={callback} />
          )}
          <Typography className={classes.logIn}>
            {ACCOUNT_ALREADY_CREATED + " "}
            <Link className={classes.logInLink} to={loginRoute}>
              {LOGIN}
            </Link>
          </Typography>
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
            {screen === "basic" && (
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
              {loading ? (
                <CircularProgress />
              ) : (
                <CurrentForm
                  screen={screen}
                  token={token}
                  callback={callback}
                />
              )}
            </div>
          </div>
        </div>
      </Hidden>
    </>
  );
}
