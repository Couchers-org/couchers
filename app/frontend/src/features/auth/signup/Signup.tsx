import { Box, makeStyles, Typography } from "@material-ui/core";
import React, { useEffect } from "react";
import { Link, Redirect, Route, Switch } from "react-router-dom";

import Alert from "../../../components/Alert";
import AuthHeader from "../../../components/AuthHeader";
import { loginRoute, signupRoute } from "../../../routes";
import { useAuthContext } from "../AuthProvider";
import AuthBg from "../resources/auth-bg.png";
import CompleteSignupForm from "./CompleteSignupForm";
import EmailForm from "./EmailForm";

const useStyles = makeStyles((theme) => ({
  signupPage: {
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "100vh",
    padding: `${theme.spacing(1)} ${theme.spacing(6)}`,
  },
  backgroundImage: {
    position: "fixed",
    left: 0,
    right: 0,
    zIndex: -1,
    display: "block",
    backgroundImage: `url(${AuthBg})`,
    backgroundColor: "#f3f3f3",
    backgroundPosition: "top center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain",
    height: "100vh",
    filter: "blur(5px)",
    opacity: "0.5",
  },
  divider: {
    width: "100%",
    marginTop: theme.spacing(2),
    marginLeft: "auto",
    marginRight: "auto",
    borderTop: "1px solid #333333",
  },
  facebookButton: {
    width: "100%",
    height: "40px",
    borderRadius: `${theme.shape.borderRadius * 2}px`,
    boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.25)",
    minHeight: `calc(calc(${theme.typography.button.lineHeight} * ${
      theme.typography.button.fontSize
    }) + ${theme.typography.pxToRem(12)})`, // from padding
    color: "#ffffff",
    fontWeight: 700,
    backgroundColor: "#2d4486",
    marginTop: theme.spacing(6),
    marginBottom: theme.spacing(2),
  },
  googleButton: {
    width: "100%",
    height: "40px",
    borderRadius: `${theme.shape.borderRadius * 2}px`,
    boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.25)",
    minHeight: `calc(calc(${theme.typography.button.lineHeight} * ${
      theme.typography.button.fontSize
    }) + ${theme.typography.pxToRem(12)})`, // from padding
    color: "#ffffff",
    fontWeight: 700,
    backgroundColor: "#d9472e",
  },
  agreement: {
    textAlign: "center",
  },
  logIn: {
    marginTop: "auto",
  },
  logInLink: {
    textDecoration: "none",
    color: theme.palette.secondary.main,
    fontWeight: 700,
  },
}));

export default function Signup() {
  const { authState, authActions } = useAuthContext();
  const authenticated = authState.authenticated;
  const error = authState.error;
  const classes = useStyles();

  useEffect(() => {
    authActions.clearError();
  }, [authActions]);

  return (
    <>
      {authenticated && <Redirect to="/" />}
      <Box className={classes.backgroundImage}></Box>{" "}
      {/* todo: extract to component */}
      <Box className={classes.signupPage}>
        <Switch>
          <Route exact path={`${signupRoute}`}>
            <AuthHeader>Let's get started!</AuthHeader>
            {error && <Alert severity="error">{error}</Alert>}
            <EmailForm />
            {/* <Divider>Or</Divider>  not yet available: https://next.material-ui.com/components/dividers/ */}
            {/* Hidden for beta: 
            <Divider classes={{ root: classes.divider }} flexItem />
            <MuiButton className={classes.facebookButton}>
              Sign up with Facebook
            </MuiButton>
            <MuiButton className={classes.googleButton}>
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
            <CompleteSignupForm />
          </Route>
        </Switch>
      </Box>
    </>
  );
}
