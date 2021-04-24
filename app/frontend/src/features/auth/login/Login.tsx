import { Divider, Hidden, Typography } from "@material-ui/core";
import React, { useEffect } from "react";
import { Link, Redirect, useLocation, useParams } from "react-router-dom";
import makeStyles from "utils/makeStyles";

import Alert from "../../../components/Alert";
import AuthHeader from "../../../components/AuthHeader";
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
  signUp: {
    marginTop: "auto",
    [theme.breakpoints.up("md")]: {
      color: theme.palette.common.white,
      lineHeight: "2.5rem",
      marginTop: 0,
    },
  },
  signUpLink: {
    color: theme.palette.primary.main,
    fontWeight: 700,
    [theme.breakpoints.up("md")]: {
      color: theme.palette.primary.main,
    },
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
      {/***** MOBILE ******/}
      <Hidden mdUp>
        <div className={authClasses.page}>
          <AuthHeader>{LOGIN_HEADER}</AuthHeader>
          {error && (
            <Alert className={authClasses.errorMessage} severity="error">
              {error}
            </Alert>
          )}
          <LoginForm />
          {/* <Divider>Or</Divider>  not yet available: https://next.material-ui.com/components/dividers/ */}
          {/* Disabled for beta:
          <Divider classes={{ root: authClasses.divider }} flexItem />
          <MuiButton className={classes.facebookButton}>
            Login with Facebook
          </MuiButton>
          <MuiButton className={classes.googleButton}>
            Login with Google
          </MuiButton> */}
          <Typography className={classes.signUp}>
            {NO_ACCOUNT_YET + " "}
            <Link className={classes.signUpLink} to={signupRoute}>
              {SIGN_UP}
            </Link>
          </Typography>
        </div>
      </Hidden>

      {/***** DESKTOP ******/}
      <Hidden smDown>
        <div className={authClasses.page}>
          <header className={authClasses.header}>
            <div className={authClasses.logo}>Couchers.org</div>
            <Typography className={classes.signUp}>
              {NO_ACCOUNT_YET + " "}
              <Link className={classes.signUpLink} to={signupRoute}>
                {SIGN_UP}
              </Link>
            </Typography>
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
              <AuthHeader>{LOGIN_HEADER}</AuthHeader>
              {/* <Divider>Or</Divider>  not yet available: https://next.material-ui.com/components/dividers/ */}
              {/*  Disabled for beta:
              <Divider classes={{ root: authClasses.divider }} flexItem />
              <MuiButton className={classes.facebookButton}>
                Login with Facebook
              </MuiButton>
              <MuiButton className={classes.googleButton}>
                Login with Google
              </MuiButton> */}
              <LoginForm />
            </div>
          </div>
        </div>
      </Hidden>
    </>
  );
}
