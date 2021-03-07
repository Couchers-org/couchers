import { Box, Divider, makeStyles, Typography } from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Button from "components/Button";
import {
  ABOUT_US,
  COLLABORATIVE,
  INTRODUCTION,
  LOGIN,
  SIGN_UP,
} from "features/auth/constants";
import useAuthStyles from "features/auth/useAuthStyles";
import React from "react";
import { Link } from "react-router-dom";
import { loginRoute, signupRoute } from "routes";

import AuthBg from "./resources/auth-bg.png";

const useStyles = makeStyles((theme) => ({
  aboutUs: {
    color: "#2a2a2a",
    marginTop: "auto",
  },
  aboutUsLink: {
    color: "#2a2a2a",
    display: "block",
    textDecoration: "none",
  },
  authPage: {
    alignItems: "flex-end",
    backgroundColor: "#f3f3f3",
    backgroundImage: `url(${AuthBg})`,
    backgroundPosition: "top center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain",
    boxSizing: "border-box",
    display: "flex",
    height: "100vh",
    justifyContent: "center",
    padding: `${theme.spacing(1, 4)}`,
  },
  button: {
    width: "45%",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    height: "50vh",
    justifyContent: "center",
    textAlign: "center",
  },
  navigation: {
    display: "flex",
    justifyContent: "space-around",
    marginTop: theme.spacing(3),
  },
  subtitle: {
    marginTop: theme.spacing(1),
  },
  title: theme.typography.h1,
}));

export default function AuthPage() {
  const classes = useStyles();
  const authClasses = useAuthStyles();

  return (
    <Box className={classes.authPage}>
      <Box className={classes.content}>
        <Typography variant="h1">{INTRODUCTION}</Typography>
        <Typography classes={{ root: classes.subtitle }}>
          {COLLABORATIVE}
        </Typography>
        <Divider classes={{ root: authClasses.divider }} flexItem />
        <Box className={classes.navigation}>
          <Button
            component={Link}
            to={loginRoute}
            classes={{
              label: authClasses.buttonText,
              root: `${authClasses.button} ${classes.button}`,
            }}
            color="secondary"
          >
            {LOGIN}
          </Button>
          <Button
            component={Link}
            to={signupRoute}
            classes={{
              label: authClasses.buttonText,
              root: `${authClasses.button} ${classes.button}`,
            }}
            color="secondary"
          >
            {SIGN_UP}
          </Button>
        </Box>
        <Box className={classes.aboutUs}>
          <Typography className={classes.aboutUsLink} component={Link} to="#">
            {ABOUT_US}
          </Typography>
          <ExpandMoreIcon />
        </Box>
      </Box>
    </Box>
  );
}
