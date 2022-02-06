import { Link as MuiLink, Typography } from "@material-ui/core";
import classNames from "classnames";
import Button from "components/Button";
import { COPYRIGHT, NON_PROFIT } from "components/Footer/constants";
import { GithubIcon } from "components/Icons";
import StyledLink from "components/StyledLink";
import { TERMS } from "features/auth/constants";
import { SHOW_ALL_EVENTS } from "features/communities/constants";
import Link from "next/link";
import { ReactNode } from "react";
import {
  blogRoute,
  contributeRoute,
  donationsRoute,
  eventsRoute,
  faqRoute,
  forumURL,
  foundationRoute,
  githubURL,
  handbookRoute,
  planRoute,
  sundaySocialURL,
  teamRoute,
  tosRoute,
  townHallURL,
  tuesdaySocialURL,
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
  GITHUB,
  HANDBOOK,
  LEGAL_NAME,
  OUR_PLAN,
  OUR_TEAM,
  TOWN_HALL,
  VOLUNTEER,
  WEEKLY_SOCIAL_SUNDAY,
  WEEKLY_SOCIAL_TUESDAY,
} from "../../appConstants";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },
  containerPadding: {
    maxWidth: theme.breakpoints.values.md,
    paddingInlineStart: theme.spacing(4),
    paddingInlineEnd: theme.spacing(4),
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
  middleOuterContainer: {
    paddingBlockEnd: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
  },
  middleContainer: {
    display: "flex",
    flexWrap: "wrap",
    margin: "0 auto",
    justifyContent: "center",
    fontStyle: "italic",
    color: theme.palette.grey[500],
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
    "& .MuiButton-label > * + *": { marginInlineStart: theme.spacing(1) },
  },
}));

export default function Footer() {
  const classes = useStyles();
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
            <FooterLink href={planRoute}>{OUR_PLAN}</FooterLink>
            <FooterLink href={faqRoute}>{FAQ}</FooterLink>
            <FooterLink href={handbookRoute}>{HANDBOOK}</FooterLink>
            <FooterLink href={tosRoute}>{TERMS}</FooterLink>
            <FooterLink href={foundationRoute}>{LEGAL_NAME}</FooterLink>
          </div>
          <div>
            <Typography variant="h3" component="h2">
              {COMMUNITY}
            </Typography>
            <FooterLink href={forumURL}>{FORUM}</FooterLink>
            <FooterLink href={blogRoute}>{BLOG}</FooterLink>
            <FooterLink href={teamRoute}>{OUR_TEAM}</FooterLink>
          </div>
          <div>
            <Typography variant="h3" component="h2">
              {EVENTS}
            </Typography>
            <FooterLink href={townHallURL}>{TOWN_HALL}</FooterLink>
            <FooterLink href={sundaySocialURL}>
              {WEEKLY_SOCIAL_SUNDAY}
            </FooterLink>
            <FooterLink href={tuesdaySocialURL}>
              {WEEKLY_SOCIAL_TUESDAY}
            </FooterLink>
            <FooterLink href={eventsRoute}>{SHOW_ALL_EVENTS}</FooterLink>
          </div>
          <div className={classes.buttonContainer}>
            <Link href={donationsRoute} passHref>
              <Button
                component="a"
                variant="contained"
                className={classes.button}
              >
                {DONATE}
              </Button>
            </Link>
            <Link href={contributeRoute} passHref>
              <Button
                component="a"
                variant="outlined"
                color="primary"
                className={classes.button}
              >
                {VOLUNTEER}
              </Button>
            </Link>
            <Button
              component="a"
              href={githubURL}
              variant="outlined"
              color="primary"
              className={classes.button}
            >
              <GithubIcon />
              <span>{GITHUB}</span>
            </Button>
            {process.env.NEXT_PUBLIC_COUCHERS_ENV !== "prod" && (
              <Button
                component="a"
                href="https://vercel.com?utm_source=couchers-org&utm_campaign=oss"
                variant="outlined"
                color="primary"
                className={classes.button}
              >
                Powered by ▲
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className={classes.middleOuterContainer}>
        <div
          className={classNames(
            classes.middleContainer,
            classes.containerPadding
          )}
        >
          <Typography variant="body2">
            <Link href={foundationRoute} passHref>
              <a>{NON_PROFIT}</a>
            </Link>
          </Typography>
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
