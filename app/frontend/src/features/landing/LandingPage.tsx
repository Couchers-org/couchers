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
import { aboutRoute, loginRoute, signupRoute } from "routes";
import makeStyles from "utils/makeStyles";

import { COUCHERS } from "../../constants";

const useStyles = makeStyles((theme) => ({}));

export default function HomePage() {
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
      <MuiLink to={aboutRoute} component={Link} className={classes.aboutUs}>
        {ABOUT_US}
        <br />
        <ExpandMoreIcon />
      </MuiLink>
    </div>
  );
}
