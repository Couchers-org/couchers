import { Link as MuiLink, Typography } from "@material-ui/core";
import classNames from "classnames";
import Button from "components/Button";
import { COPYRIGHT } from "components/Footer/constants";
import { GithubIcon } from "components/Icons";
import StyledLink from "components/StyledLink";
import { TERMS } from "features/auth/constants";
import { SHOW_ALL_EVENTS } from "features/communities/constants";
import Link from "next/link";
import { ReactNode } from "react";
import {
  blogURL,
  contributeRoute,
  donationsRoute,
  eventsRoute,
  faqURL,
  forumURL,
  foundationURL,
  githubURL,
  handbookURL,
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
  GITHUB,
  HANDBOOK,
  OUR_PLAN,
  OUR_TEAM,
  TOWN_HALL,
  VOLUNTEER,
} from "../../appConstants";

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
      gridTemplateColumns: "repeat(4, auto)",
      justifyItems: "center",
    },
    [theme.breakpoints.up("md")]: {
      gridTemplateColumns: "repeat(4, auto)",
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
    flexWrap: "wrap",
    margin: "0 auto",
    justifyContent: "center",
    "& > * + *": {
      marginInlineStart: theme.spacing(2),
    },
    "& > * + *::before": {
      content: "'|'",
      marginInlineEnd: theme.spacing(2),
    },
  },
  buttonContainer: {
    display: "flex",
    flexDirection: "column",
    justifySelf: "flex-start",
  },
  button: {
    minWidth: "8rem",
    textAlign: "center",
    marginBlockEnd: theme.spacing(2),
    [theme.breakpoints.up("sm")]: {
      minWidth: "12rem",
    },
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
            <FooterLink href={planURL}>{OUR_PLAN}</FooterLink>
            <FooterLink href={faqURL}>{FAQ}</FooterLink>
            <FooterLink href={handbookURL}>{HANDBOOK}</FooterLink>
            <FooterLink href={tosRoute}>{TERMS}</FooterLink>
            <FooterLink href={foundationURL}>{FOUNDATION}</FooterLink>
          </div>
          <div>
            <Typography variant="h3" component="h2">
              {COMMUNITY}
            </Typography>
            <FooterLink href={forumURL}>{FORUM}</FooterLink>
            <FooterLink href={blogURL}>{BLOG}</FooterLink>
            <FooterLink href={teamURL}>{OUR_TEAM}</FooterLink>
          </div>
          <div>
            <Typography variant="h3" component="h2">
              {EVENTS}
            </Typography>
            <FooterLink href={townHallURL}>{TOWN_HALL}</FooterLink>
            <FooterLink href={eventsRoute}>{SHOW_ALL_EVENTS}</FooterLink>
          </div>
          <div className={classes.buttonContainer}>
            <Button
              component={Link}
              href={donationsRoute}
              variant="contained"
              className={classes.button}
            >
              {DONATE}
            </Button>
            <Button
              component={Link}
              href={contributeRoute}
              variant="outlined"
              color="primary"
              className={classes.button}
            >
              {VOLUNTEER}
            </Button>
            <Button
              component={MuiLink}
              href={githubURL}
              variant="outlined"
              color="primary"
              className={classes.button}
              startIcon={<GithubIcon />}
            >
              {GITHUB}
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
          <Typography>
            It&apos;s like Couchsurfing&#8482;, but better.
          </Typography>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  if (href.startsWith("http")) {
    return (
      <Typography>
        <MuiLink
          href={href}
          color="textSecondary"
          target="_blank"
          rel="noopener"
        >
          {children}
        </MuiLink>
      </Typography>
    );
  }
  return (
    <Typography>
      <StyledLink href={href} color="textSecondary">
        {children}
      </StyledLink>
    </Typography>
  );
}
