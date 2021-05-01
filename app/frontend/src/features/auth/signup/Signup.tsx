import { Divider, Hidden, Typography } from "@material-ui/core";
import React, { useEffect } from "react";
import { Link, Redirect, Route, Switch } from "react-router-dom";
import makeStyles from "utils/makeStyles";

import Alert from "../../../components/Alert";
import AuthHeader from "../../../components/AuthHeader";
import { loginRoute, signupRoute } from "../../../routes";
import { useAuthContext } from "../AuthProvider";
import {
  ACCOUNT_ALREADY_CREATED,
  INTRODUCTION_SUBTITLE,
  INTRODUCTION_TITLE,
  LOGIN,
  SIGN_UP_AGREEMENT,
  SIGN_UP_COMPLETE_HEADER,
  SIGN_UP_HEADER,
} from "../constants";
import useAuthStyles from "../useAuthStyles";
import CompleteSignupForm from "./CompleteSignupForm";
import EmailForm from "./EmailForm";

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

export default function Signup() {
  const { authState, authActions } = useAuthContext();
  const authenticated = authState.authenticated;
  const error = authState.error;
  const authClasses = useAuthStyles();
  const classes = useStyles();

  useEffect(() => {
    authActions.clearError();
  }, [authActions]);

  return (
    <>
      {authenticated && <Redirect to="/" />}
      {/***** MOBILE ******/}
      <Hidden mdUp>
        <div className={authClasses.page}>
          <Switch>
            <Route exact path={signupRoute}>
              <AuthHeader>{SIGN_UP_HEADER}</AuthHeader>
              {error && (
                <Alert className={authClasses.errorMessage} severity="error">
                  {error}
                </Alert>
              )}
              <EmailForm />
              {/* <Divider>Or</Divider>  not yet available: https://next.material-ui.com/components/dividers/ */}
              {/* Hidden for beta: 
            <Divider classes={{ root: authClasses.divider }} flexItem />
            <MuiButton className={authClasses.facebookButton}>
              Sign up with Facebook
            </MuiButton>
            <MuiButton className={authClasses.googleButton}>
              Sign up with Google
            </MuiButton>
            */}
              <Typography variant="body1" className={classes.agreement}>
                {SIGN_UP_AGREEMENT}
              </Typography>
              <Typography className={classes.logIn}>
                {ACCOUNT_ALREADY_CREATED + " "}
                <Link className={classes.logInLink} to={loginRoute}>
                  {LOGIN}
                </Link>
              </Typography>
            </Route>
            <Route path={`${signupRoute}/:urlToken?`}>
              <AuthHeader>{SIGN_UP_COMPLETE_HEADER}</AuthHeader>
              {error && (
                <Alert className={authClasses.errorMessage} severity="error">
                  {error}
                </Alert>
              )}
              <CompleteSignupForm />
            </Route>
          </Switch>
        </div>
      </Hidden>

      {/***** DESKTOP ******/}
      <Hidden smDown>
        <div className={authClasses.page}>
          <header className={authClasses.header}>
            <div className={authClasses.logo}>Couchers.org</div>
            <Switch>
              <Route exact path={signupRoute}>
                <Typography className={classes.logIn}>
                  {ACCOUNT_ALREADY_CREATED + " "}
                  <Link className={classes.logInLink} to={loginRoute}>
                    {LOGIN}
                  </Link>
                </Typography>
              </Route>
            </Switch>
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
            <Switch>
              <Route exact path={signupRoute}>
                <div className={authClasses.formWrapper}>
                  {error && (
                    <Alert
                      className={authClasses.errorMessage}
                      severity="error"
                    >
                      {error}
                    </Alert>
                  )}
                  <AuthHeader>{SIGN_UP_HEADER}</AuthHeader>
                  {/* <Divider>Or</Divider>  not yet available: https://next.material-ui.com/components/dividers/ */}
                  {/* Hidden for beta: 
            <Divider classes={{ root: authClasses.divider }} flexItem />
            <MuiButton className={authClasses.facebookButton}>
              Sign up with Facebook
            </MuiButton>
            <MuiButton className={authClasses.googleButton}>
              Sign up with Google
            </MuiButton>
            */}
                  <EmailForm />
                  <Typography variant="body1" className={classes.agreement}>
                    {SIGN_UP_AGREEMENT}
                  </Typography>
                </div>
              </Route>
              <Route path={`${signupRoute}/:urlToken?`}>
                <div className={authClasses.formWrapper}>
                  <AuthHeader>{SIGN_UP_COMPLETE_HEADER}</AuthHeader>
                  {error && (
                    <Alert
                      className={authClasses.errorMessage}
                      severity="error"
                    >
                      {error}
                    </Alert>
                  )}
                  <CompleteSignupForm />
                </div>
              </Route>
            </Switch>
          </div>
        </div>
      </Hidden>
    </>
  );
}
