import {
  Link as MuiLink,
  ListItemAvatar,
  ListItemText,
  Typography,
} from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import classNames from "classnames";
import Avatar from "components/Avatar";
import ScoreBar from "components/Bar/ScoreBar";
import { LinkIcon } from "components/Icons";
import { COMMUNITY_STANDING } from "features/constants";
import { User } from "pb/api_pb";
import React from "react";
import { Link } from "react-router-dom";
import { routeToUser } from "routes";
import makeStyles from "utils/makeStyles";

export const useStyles = makeStyles((theme) => ({
  avatar: {
    marginInlineEnd: theme.spacing(2),
  },
  avatarBig: {
    height: "4.5rem",
    width: "4.5rem",
  },
  avatarSmall: {
    height: "3rem",
    width: "3rem",
  },
  root: {
    display: "flex",
    padding: 0,
    width: "100%",
  },
  title: {
    marginTop: 0,
  },
  link: {
    display: "flex",
    alignItems: "center",
  },
  linkIcon: { display: "block", marginInlineStart: theme.spacing(1) },
  titleAndBarContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-around",
    margin: 0,
    minHeight: theme.spacing(9),
  },
}));

interface UserSummaryProps {
  avatarIsLink?: boolean;
  children?: React.ReactNode;
  compact?: boolean;
  headlineComponent?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  user?: User.AsObject;
  titleIsLink?: boolean;
}

export default function UserSummary({
  avatarIsLink = true,
  children,
  compact = false,
  headlineComponent = "h2",
  user,
  titleIsLink = false,
}: UserSummaryProps) {
  const classes = useStyles();

  const title = (
    <Typography
      component={headlineComponent}
      variant="h2"
      className={classes.title}
      noWrap={compact}
    >
      {!user ? (
        <Skeleton />
      ) : (
        <>{compact ? user.name : `${user.name}, ${user.age}, ${user.city}`}</>
      )}
    </Typography>
  );

  return (
    <div className={classes.root}>
      <ListItemAvatar>
        {!user ? (
          <Skeleton variant="circle" className={classes.avatar} />
        ) : (
          <Avatar
            user={user}
            className={classNames(
              classes.avatar,
              compact ? classes.avatarSmall : classes.avatarBig
            )}
            isProfileLink={avatarIsLink}
          />
        )}
      </ListItemAvatar>
      <ListItemText
        className={classes.titleAndBarContainer}
        disableTypography
        primary={
          titleIsLink && user ? (
            <MuiLink
              component={Link}
              to={routeToUser(user.username)}
              className={classes.link}
            >
              {title}
              <LinkIcon className={classes.linkIcon} />
            </MuiLink>
          ) : (
            title
          )
        }
        secondary={
          <>
            <ScoreBar value={(user?.communityStanding || 0) * 100}>
              {COMMUNITY_STANDING}
            </ScoreBar>
            {children}
          </>
        }
      />
    </div>
  );
}
