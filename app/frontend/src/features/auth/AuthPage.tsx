import { Divider, Hidden, makeStyles, Typography } from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Button from "components/Button";
import {
  ABOUT_US,
  COLLABORATIVE,
  INTRODUCTION,
  LOGIN,
  SIGN_UP,
} from "features/auth/constants";
import DesktopAuthBg from "features/auth/resources/desktop-auth-bg.png";
import MobileAuthBg from "features/auth/resources/mobile-auth-bg.png";
import useAuthStyles from "features/auth/useAuthStyles";
import React from "react";
import { Link } from "react-router-dom";
import { loginRoute, signupRoute } from "routes";

const useStyles = makeStyles((theme) => ({
  aboutUs: {
    color: "#2a2a2a",
    marginTop: "auto",
  },
  aboutUsLink: {
    color: "#2a2a2a",
    display: "block",
    textDecoration: "none",
    [theme.breakpoints.up("md")]: {
      color: "#ffffff",
      fontWeight: 500,
      fontSize: "20px",
      marginRight: theme.spacing(3),
      padding: theme.spacing(1),
    },
  },
  authPage: {
    alignItems: "flex-end",
    backgroundColor: "#f3f3f3",
    backgroundImage: `url(${MobileAuthBg})`,
    backgroundPosition: "top center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain",
    boxSizing: "border-box",
    display: "flex",
    height: "100vh",
    justifyContent: "center",
    padding: `${theme.spacing(1, 4)}`,
    [theme.breakpoints.up("md")]: {
      alignItems: "flex-start",
      backgroundImage: `url(${DesktopAuthBg})`,
      backgroundSize: "cover",
      flexDirection: "column",
      padding: 0,
      width: "100%",
    },
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
    [theme.breakpoints.up("md")]: {
      height: "100%",
      margin: "0 auto",
      width: "960px",
    },
  },
  desktopNavigation: {
    display: "flex",
  },
  introduction: {
    color: "#ffffff",
    textAlign: "left",
    width: "742px",
  },
  loginLink: {
    border: `1px solid ${theme.palette.primary.main}`,
    borderRadius: "4px",
    color: "#ffffff",
    fontWeight: 500,
    fontSize: "20px",
    marginRight: theme.spacing(3),
    padding: theme.spacing(1, 0),
    textAlign: "center",
    textDecoration: "none",
    width: "88px",
  },
  mobileNavigation: {
    display: "flex",
    justifyContent: "space-around",
    marginTop: theme.spacing(3, 0),
  },
  signupLink: {
    backgroundColor: theme.palette.primary.main,
    borderRadius: "4px",
    color: "#ffffff",
    fontWeight: 500,
    fontSize: "20px",
    padding: theme.spacing(1),
    textAlign: "center",
    textDecoration: "none",
    width: "88px",
  },
  subtitle: {
    marginTop: theme.spacing(1),
    [theme.breakpoints.up("md")]: {
      display: "inline-block",
      marginTop: theme.spacing(5),
      position: "relative",
    },
  },
  title: {
    ...theme.typography.h1,
    [theme.breakpoints.up("md")]: {
      fontSize: "64px",
      lineHeight: "74px",
      textAlign: "left",
    },
  },
  underline: {
    borderTop: `5px solid ${theme.palette.primary.main}`,
    boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
    left: theme.spacing(1),
    position: "absolute",
    width: "100%",
  },
}));

export default function AuthPage() {
  const classes = useStyles();
  const authClasses = useAuthStyles();

  return (
    <div className={classes.authPage}>
      <Hidden mdUp>
        <div className={classes.content}>
          <Typography variant="h1">{INTRODUCTION}</Typography>
          <Typography classes={{ root: classes.subtitle }}>
            {COLLABORATIVE}
          </Typography>
          <Divider classes={{ root: authClasses.divider }} flexItem />
          <div className={classes.mobileNavigation}>
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
          </div>
          <div className={classes.aboutUs}>
            <Typography className={classes.aboutUsLink} component={Link} to="#">
              {ABOUT_US}
            </Typography>
            <ExpandMoreIcon />
          </div>
        </div>
      </Hidden>
      <Hidden smDown>
        <header className={authClasses.header}>
          <div className={authClasses.logo}>Couchers.org</div>
          <nav className={classes.desktopNavigation}>
            <Link to="#" className={classes.aboutUsLink}>
              About us
            </Link>
            <Link to={loginRoute} className={classes.loginLink}>
              {LOGIN}
            </Link>
            <Link to={signupRoute} className={classes.signupLink}>
              {SIGN_UP}
            </Link>
          </nav>
        </header>
        <div className={classes.content}>
          <div className={classes.introduction}>
            <Typography classes={{ root: classes.title }} variant="h1">
              {INTRODUCTION}
            </Typography>
            <Typography classes={{ root: classes.subtitle }} variant="h2">
              {COLLABORATIVE}
              <Divider className={classes.underline}></Divider>
            </Typography>
          </div>
        </div>
      </Hidden>
    </div>
  );
}
