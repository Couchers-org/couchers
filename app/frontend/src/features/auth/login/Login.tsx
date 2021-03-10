import { Box, makeStyles, Typography } from "@material-ui/core";
import React, { useEffect } from "react";
import { Link, Redirect, useLocation, useParams } from "react-router-dom";

import Alert from "../../../components/Alert";
import AuthHeader from "../../../components/AuthHeader";
import { loginPasswordRoute, signupRoute } from "../../../routes";
import { useAuthContext } from "../AuthProvider";
import useAuthStyles from "../useAuthStyles";
import LoginForm from "./LoginForm";

const useStyles = makeStyles((theme) => ({
  signUp: {
    marginTop: "auto",
  },
  signUpLink: {
    color: theme.palette.secondary.main,
    fontWeight: 700,
    textDecoration: "none",
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
    //check for a login token
    if (urlToken && location.pathname !== loginPasswordRoute) {
      authActions.tokenLogin(urlToken);
    }
  }, [urlToken, authActions, location.pathname]);

  return (
    <>
      {authenticated && <Redirect to={redirectTo} />}
      <Box className={authClasses.backgroundBlurImage}></Box>
      <Box className={authClasses.page}>
        <AuthHeader>Welcome back!</AuthHeader>
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
        </MuiButton>
        */}
        <Typography className={classes.signUp}>
          No account yet?{" "}
          <Link className={classes.signUpLink} to={signupRoute}>
            Sign up
          </Link>
        </Typography>
      </Box>
    </>
  );
}
