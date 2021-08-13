import { Divider, Link as MuiLink, Typography } from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import {
  ABOUT_US,
  INTRODUCTION_SUBTITLE,
  INTRODUCTION_TITLE,
  LOGIN,
  SIGN_UP,
} from "features/auth/constants";
import DesktopAuthBg from "features/auth/resources/desktop-auth-bg.jpg";
import MobileAuthBg from "features/auth/resources/mobile-auth-bg.jpg";
import useAuthStyles from "features/auth/useAuthStyles";
import { Link } from "react-router-dom";
import CouchersLogo from "resources/CouchersLogo";
import { loginRoute, signupRoute } from "routes";
import makeStyles from "utils/makeStyles";

import { COUCHERS } from "../../constants";

const useStyles = makeStyles((theme) => ({
  aboutUs: {
    display: "block",
    color: theme.palette.common.white,
    textAlign: "center",
    paddingTop: theme.spacing(1),
    fontWeight: 500,
    fontSize: "1rem",
    marginTop: theme.spacing(1),
    lineHeight: 1,
    [theme.breakpoints.up("md")]: {
      fontSize: "1.25rem",
    },
  },
  authPage: {
    display: "flex",
    flexDirection: "column",

    background: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url("${MobileAuthBg}")`,
    backgroundPosition: "top center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    height: "100vh",
    width: "100%",
    padding: `${theme.spacing(1, 4)}`,
    paddingBottom: 0,
    [theme.breakpoints.up("md")]: {
      background: `url(${DesktopAuthBg})`,
      backgroundSize: "cover",
    },
    [theme.breakpoints.down("sm")]: {},
  },
  button: {
    width: "45%",
  },
  content: {
    flexGrow: 1,
    color: theme.palette.common.white,
    flexDirection: "column",
    display: "flex",
    justifyContent: "flex-end",
    textAlign: "center",
    [theme.breakpoints.up("md")]: {
      justifyContent: "center",
      textAlign: "left",
      width: "72%",
    },
  },
  title: {
    ...theme.typography.h1,
    [theme.breakpoints.up("md")]: {
      fontSize: "4rem",
      lineHeight: "1.15",
    },
  },
  subtitle: {
    marginTop: theme.spacing(1),
    [theme.breakpoints.up("md")]: {
      display: "inline-block",
      marginTop: theme.spacing(4),
      fontSize: "1.5rem",
      lineHeight: "1.15",
    },
  },
  underline: {
    borderTop: `5px solid ${theme.palette.primary.main}`,
    boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
    left: theme.spacing(1),
    position: "relative",
    width: "100%",
    [theme.breakpoints.down("sm")]: {
      position: "static",
      borderTop: `2px solid ${theme.palette.common.white}`,
      boxShadow: "none",
      marginTop: theme.spacing(2),
    },
  },
  buttonContainer: {
    display: "flex",
    marginTop: theme.spacing(5),
    [theme.breakpoints.down("sm")]: {
      justifyContent: "center",
    },
  },
  link: {
    borderRadius: theme.shape.borderRadius,
    color: theme.palette.common.white,
    fontSize: "1.25rem",
    fontWeight: 500,
    textAlign: "center",
    padding: theme.spacing(1, 2),
  },
  loginLink: {
    backgroundColor: theme.palette.primary.main,
    marginInlineEnd: theme.spacing(3),
  },
  signupLink: {
    backgroundColor: theme.palette.primary.main,
  },
}));

export default function LandingPage() {
  const classes = useStyles();
  const authClasses = useAuthStyles();

  return (
    <div className={classes.authPage}>
      <header className={authClasses.logoContainer}>
        <CouchersLogo />
        <div className={authClasses.logo}>{COUCHERS}</div>
      </header>
      <div className={classes.content}>
        <div>
          <Typography className={classes.title} variant="h1">
            {INTRODUCTION_TITLE}
          </Typography>
          <Typography className={classes.subtitle} variant="h2">
            {INTRODUCTION_SUBTITLE}
            <Divider className={classes.underline}></Divider>
          </Typography>
        </div>
        <div className={classes.buttonContainer}>
          <Link
            to={loginRoute}
            className={`${classes.link} ${classes.loginLink}`}
          >
            {LOGIN}
          </Link>
          <Link
            to={signupRoute}
            className={`${classes.link} ${classes.signupLink}`}
          >
            {SIGN_UP}
          </Link>
        </div>
      </div>
      <MuiLink className={classes.aboutUs} href="https://couchers.org">
        {ABOUT_US}
        <br />
        <ExpandMoreIcon />
      </MuiLink>
    </div>
  );
}
