import { Box, Divider, makeStyles, Typography } from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import React from "react";
import { Link } from "react-router-dom";

import Button from "../../components/Button";
import { loginRoute, signupRoute } from "../../routes";
import AuthBg from "./resources/auth-bg.png";
import useAuthStyles from "./useAuthStyles";

const useStyles = makeStyles((theme) => ({
  authPage: {
    boxSizing: "border-box",
    backgroundColor: "#f3f3f3",
    backgroundImage: `url(${AuthBg})`,
    backgroundPosition: "top center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end",
    height: "100vh",
    padding: `${theme.spacing(1)} ${theme.spacing(4)}`,
  },
  content: {
    display: "flex",
    flexDirection: "column",
    height: "50vh",
    justifyContent: "center",
    textAlign: "center",
  },
  title: theme.typography.h1,
  subtitle: {
    marginTop: theme.spacing(1),
  },
  navigation: {
    display: "flex",
    justifyContent: "space-around",
    marginTop: theme.spacing(3),
  },
  aboutUs: {
    marginTop: "auto",
    color: "#2a2a2a",
  },
  aboutUsLink: {
    textDecoration: "none",
    display: "block",
    color: "#2a2a2a",
  },
}));

export default function AuthPage() {
  const classes = useStyles();
  const authClasses = useAuthStyles();

  return (
    <Box className={classes.authPage}>
      <Box className={classes.content}>
        <Typography variant="h1">Connect with the world around you</Typography>
        <Typography classes={{ root: classes.subtitle }}>
          Build collaboratively and always free
        </Typography>
        <Divider classes={{ root: authClasses.divider }} flexItem />
        <Box className={classes.navigation}>
          <Button
            component={Link}
            to={loginRoute}
            classes={{
              root: authClasses.button,
              label: authClasses.buttonText,
            }}
            color="secondary"
          >
            Login
          </Button>
          <Button
            component={Link}
            to={signupRoute}
            classes={{
              root: authClasses.button,
              label: authClasses.buttonText,
            }}
            color="secondary"
          >
            Sign up
          </Button>
        </Box>
        <Box className={classes.aboutUs}>
          <Typography className={classes.aboutUsLink} component={Link} to="#">
            About us
          </Typography>
          <ExpandMoreIcon />
        </Box>
      </Box>
    </Box>
  );
}
