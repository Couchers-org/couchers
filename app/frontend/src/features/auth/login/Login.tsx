import { Divider, Link as MuiLink, Typography } from "@material-ui/core";
import { useEffect } from "react";
import { Link, Redirect, useLocation, useParams } from "react-router-dom";
import CouchersLogo from "resources/CouchersLogo";
import makeStyles from "utils/makeStyles";

import Alert from "../../../components/Alert";
import { COUCHERS } from "../../../constants";
import { signupRoute } from "../../../routes";
import { useAuthContext } from "../AuthProvider";
import {
  INTRODUCTION_SUBTITLE,
  INTRODUCTION_TITLE,
  LOGIN_HEADER,
  NO_ACCOUNT_YET,
  SIGN_UP,
} from "../constants";
import useAuthStyles from "../useAuthStyles";
import LoginForm from "./LoginForm";

const useStyles = makeStyles((theme) => ({
  signUp: {},
  signUpLink: {
    fontWeight: 700,
  },
}));

export default function Login() {
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
      {authenticated && <Redirect to={redirectTo} />}
      <div className={authClasses.page}>
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
          <div className={authClasses.formWrapper}>
            <Typography variant="h1" gutterBottom>
              {LOGIN_HEADER}
            </Typography>
            {error && (
              <Alert className={authClasses.errorMessage} severity="error">
                {error}
              </Alert>
            )}
            <LoginForm />
            <Typography className={classes.signUp}>
              {NO_ACCOUNT_YET + " "}
              <MuiLink
                className={classes.signUpLink}
                to={signupRoute}
                component={Link}
              >
                {SIGN_UP}
              </MuiLink>
            </Typography>
          </div>
        </div>
      </div>
    </>
  );
}
