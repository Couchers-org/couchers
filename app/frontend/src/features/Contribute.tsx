import { makeStyles, Typography } from "@material-ui/core";
import { LOGIN } from "features/auth/constants";
import DesktopAuthBg from "features/auth/resources/desktop-auth-bg.jpg";
import { Link } from "react-router-dom";
import { loginRoute } from "routes";

import { COUCHERS } from "../constants";
import ContributorForm, {
  CONTRIBUTE,
  FILL_IN_THE_FORM,
  JOIN_THE_TEAM,
} from "./contributorForm";

const useStyles = makeStyles((theme) => ({
  bg: {
    height: "100%",
    width: "100%",
    backgroundColor: theme.palette.common.white,
    // backgroundAttachment: "scroll, local",
    backgroundPosition: "top center",
    backgroundRepeat: "no-repeat",
    backgroundImage: `url(${DesktopAuthBg})`,
    backgroundSize: "cover",
    position: "fixed",
    zIndex: -1000,
  },
  page: {
    boxSizing: "border-box",
    display: "flex",
    height: "100vh",
    alignItems: "flex-start",
    flexDirection: "column",
    padding: 0,
    width: "100%",
  },
  content: {
    flexDirection: "column",
    height: "100%",
    margin: "0 auto",
  },
  nav: {
    display: "flex",
  },
  link: {
    borderRadius: theme.shape.borderRadius / 3,
    color: theme.palette.common.white,
    fontSize: "1.25rem",
    fontWeight: 500,
    textAlign: "center",
    padding: theme.spacing(1, 2),
  },
  loginLink: {
    border: `1px solid ${theme.palette.primary.main}`,
    marginRight: theme.spacing(3),
  },
  formWrapper: {
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius / 3,
    padding: theme.spacing(5, 3),
  },
  header: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: theme.spacing(2, 4),
    marginBottom: theme.spacing(2),
  },
  logo: {
    color: theme.palette.secondary.main,
    fontFamily: "'Mansalva', cursive",
    fontSize: "2rem",
  },
}));

export default function Contribute() {
  const classes = useStyles();

  return (
    <div className={classes.page}>
      <div className={classes.bg} />
      <header className={classes.header}>
        <div className={classes.logo}>{COUCHERS}</div>
        <nav className={classes.nav}>
          <Link
            to={loginRoute}
            className={`${classes.link} ${classes.loginLink}`}
          >
            {LOGIN}
          </Link>
        </nav>
      </header>
      <div className={classes.content}>
        <div className={classes.formWrapper}>
          <Typography variant="h1">{CONTRIBUTE}</Typography>
          <Typography variant="subtitle1">{JOIN_THE_TEAM}</Typography>
          <p>{FILL_IN_THE_FORM}</p>
          <ContributorForm />
        </div>
      </div>
    </div>
  );
}
