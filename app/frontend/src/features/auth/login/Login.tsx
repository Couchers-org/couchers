import { Box, makeStyles, Typography } from "@material-ui/core";
import React, { useEffect } from "react";
import { Link, Redirect, useLocation, useParams } from "react-router-dom";

import Alert from "../../../components/Alert";
import Header from "../../../components/AuthHeader";
import AuthBg from "../../../resources/auth-bg.png";
import { loginPasswordRoute, signupRoute } from "../../../routes";
import { useAuthContext } from "../AuthProvider";
import LoginForm from "./LoginForm";

const useStyles = makeStyles((theme) => ({
  loginPage: {
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
  button: {
    width: "100%",
    color: "#ffffff",
    fontWeight: 700,
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
  signUp: {
    marginTop: "auto",
  },
  signUpLink: {
    textDecoration: "none",
    color: theme.palette.secondary.main,
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
      <Box className={classes.backgroundImage}></Box>
      <Box className={classes.loginPage}>
        <Header>Welcome back!</Header>
        {error && <Alert severity="error">{error}</Alert>}
        <LoginForm />
        {/* <Divider>Or</Divider>  not yet available: https://next.material-ui.com/components/dividers/ */}
        {/* Disabled for beta:
        <Divider classes={{ root: classes.divider }} flexItem />
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
