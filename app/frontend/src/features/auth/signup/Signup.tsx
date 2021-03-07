import { Box, makeStyles, Typography } from "@material-ui/core";
import React, { useEffect } from "react";
import { Link, Redirect, Route, Switch } from "react-router-dom";

import Alert from "../../../components/Alert";
import AuthHeader from "../../../components/AuthHeader";
import { loginRoute, signupRoute } from "../../../routes";
import { useAuthContext } from "../AuthProvider";
import useAuthStyles from "../useAuthStyles";
import CompleteSignupForm from "./CompleteSignupForm";
import EmailForm from "./EmailForm";

const useStyles = makeStyles((theme) => ({
  agreement: {
    textAlign: "center",
  },
  logIn: {
    marginTop: "auto",
  },
  logInLink: {
    color: theme.palette.secondary.main,
    fontWeight: 700,
    textDecoration: "none",
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
      <Box className={authClasses.backgroundBlurImage}></Box>{" "}
      {/* todo: extract to component */}
      <Box className={authClasses.page}>
        <Switch>
          <Route exact path={`${signupRoute}`}>
            <AuthHeader>Let's get started!</AuthHeader>
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
              By signing up, you agree with the T&Cs of using the platform and
              confirm to adhere to our Code of Conduct.
            </Typography>
            <Typography className={classes.logIn}>
              Already have an account?{" "}
              <Link className={classes.logInLink} to={loginRoute}>
                Log in
              </Link>
            </Typography>
          </Route>
          <Route path={`${signupRoute}/:urlToken?`}>
            <AuthHeader>Your basic details</AuthHeader>
            {error && (
              <Alert className={authClasses.errorMessage} severity="error">
                {error}
              </Alert>
            )}
            <CompleteSignupForm />
          </Route>
        </Switch>
      </Box>
    </>
  );
}
