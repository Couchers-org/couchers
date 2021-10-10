import { Link as MuiLink, Typography } from "@material-ui/core";
import classNames from "classnames";
import Button from "components/Button";
import { COPYRIGHT } from "components/Footer/constants";
import StyledLink from "components/StyledLink";
import { TERMS_OF_SERVICE } from "features/auth/constants";
import { SHOW_ALL_EVENTS } from "features/communities/constants";
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  blogURL,
  contributeRoute,
  donationsRoute,
  eventsRoute,
  faqURL,
  forumURL,
  foundationURL,
  planURL,
  teamURL,
  tosRoute,
  townHallURL,
} from "routes";
import makeStyles from "utils/makeStyles";

import {
  ABOUT,
  BLOG,
  COMMUNITY,
  DONATE,
  EVENTS,
  FAQ,
  FORUM,
  FOUNDATION,
  OUR_PLAN,
  OUR_TEAM,
  TOWN_HALL,
  VOLUNTEER,
} from "../../constants";

interface FooterProps {
  maxWidth: string | number;
  paddingInline: string | number;
}

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },
  containerPadding({ maxWidth, paddingInline }: FooterProps) {
    return {
      maxWidth,
      paddingInlineStart: paddingInline,
      paddingInlineEnd: paddingInline,
    };
  },
  upperOuterContainer: {
    display: "flex",
    justifyContent: "center",
    marginBlockStart: theme.spacing(2),
    paddingBlockStart: theme.spacing(3),
    paddingBlockEnd: theme.spacing(3),
    borderTop: `solid 1px ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  },
  upperContainer: {
    width: "100%",
    display: "grid",
    rowGap: theme.spacing(1),
    columnGap: theme.spacing(1),
    gridTemplateColumns: "auto auto",
    [theme.breakpoints.up("sm")]: {
      gridTemplateColumns: "auto auto auto auto",
    },
    [theme.breakpoints.up("md")]: {
      gridTemplateColumns: "auto auto auto auto",
      justifyContent: "center",
      columnGap: theme.spacing(8),
    },
  },
  lowerOuterContainer: {
    paddingBlockStart: theme.spacing(2),
    paddingBlockEnd: theme.spacing(2),
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.getContrastText(theme.palette.primary.main),
  },
  lowerContainer: {
    display: "flex",
    justifyContent: "center",
    "& > * + *": {
      marginInlineStart: theme.spacing(2),
    },
    "& > * + *::before": {
      content: "'|'",
      marginInlineEnd: theme.spacing(2),
    },
  },
  button: {
    display: "block",
    minWidth: "12rem",
    textAlign: "center",
    marginBlockEnd: theme.spacing(2),
  },
}));

export default function Footer({ maxWidth, paddingInline }: FooterProps) {
  const classes = useStyles({ maxWidth, paddingInline });
  return (
    <footer className={classes.root}>
      <div className={classes.upperOuterContainer}>
        <div
          className={classNames(
            classes.upperContainer,
            classes.containerPadding
          )}
        >
          <div>
            <Typography variant="h3" component="h2">
              {ABOUT}
            </Typography>
            <FooterLink to={planURL}>{OUR_PLAN}</FooterLink>
            <FooterLink to={faqURL}>{FAQ}</FooterLink>
            <FooterLink to={foundationURL}>{FOUNDATION}</FooterLink>
          </div>
          <div>
            <Typography variant="h3" component="h2">
              {COMMUNITY}
            </Typography>
            <FooterLink to={forumURL}>{FORUM}</FooterLink>
            <FooterLink to={blogURL}>{BLOG}</FooterLink>
            <FooterLink to={teamURL}>{OUR_TEAM}</FooterLink>
          </div>
          <div>
            <Typography variant="h3" component="h2">
              {EVENTS}
            </Typography>
            <FooterLink to={townHallURL}>{TOWN_HALL}</FooterLink>
            <FooterLink to={eventsRoute}>{SHOW_ALL_EVENTS}</FooterLink>
          </div>
          <div>
            <Button
              component={Link}
              to={donationsRoute}
              variant="contained"
              className={classes.button}
            >
              {DONATE}
            </Button>
            <Button
              component={Link}
              to={contributeRoute}
              variant="outlined"
              color="primary"
              className={classes.button}
            >
              {VOLUNTEER}
            </Button>
          </div>
        </div>
      </div>
      <div className={classes.lowerOuterContainer}>
        <div
          className={classNames(
            classes.lowerContainer,
            classes.containerPadding
          )}
        >
          <Typography>{COPYRIGHT}</Typography>
          <StyledLink to={tosRoute} color="inherit">
            {TERMS_OF_SERVICE}
          </StyledLink>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ to, children }: { to: string; children: ReactNode }) {
  if (to.startsWith("http")) {
    return (
      <MuiLink
        href={to}
        color="textSecondary"
        style={{ display: "block" }}
        target="_blank"
        rel="noopener"
      >
        {children}
      </MuiLink>
    );
  }
  return (
    <StyledLink to={to} color="textSecondary" style={{ display: "block" }}>
      {children}
    </StyledLink>
  );
}
