import { Box, Divider, makeStyles, Typography } from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import React from "react";
import { Link } from "react-router-dom";

import Button from "../../components/Button";
import { loginRoute, signupRoute } from "../../routes";
import AuthBg from "./resources/auth-bg.png";

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
  divider: {
    width: theme.spacing(16),
    marginTop: theme.spacing(2),
    marginLeft: "auto",
    marginRight: "auto",
    borderTop: "1px solid #333333",
  },
  navigation: {
    display: "flex",
    justifyContent: "space-around",
    marginTop: theme.spacing(3),
  },
  button: {
    width: "45%",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: 700,
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

  return (
    <Box className={classes.authPage}>
      <Box className={classes.content}>
        <Typography variant="h1">Connect with the world around you</Typography>
        <Typography classes={{ root: classes.subtitle }}>
          Build collaboratively and always free
        </Typography>
        <Divider classes={{ root: classes.divider }} flexItem />
        <Box className={classes.navigation}>
          <Button
            component={Link}
            to={loginRoute}
            classes={{
              root: classes.button,
              label: classes.buttonText,
            }}
            color="secondary"
          >
            Login
          </Button>
          <Button
            component={Link}
            to={signupRoute}
            classes={{
              root: classes.button,
              label: classes.buttonText,
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
