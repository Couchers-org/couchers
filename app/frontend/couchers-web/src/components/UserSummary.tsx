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
import { User } from "couchers-core/src/proto/api_pb";
import { COMMUNITY_STANDING } from "features/constants";
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
    alignItems: "center",
  },
  titleSkeleton: {
    maxWidth: 300,
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
    display: "grid",
    gridGap: theme.spacing(0.5),
    margin: 0,
    minHeight: theme.spacing(9),
  },
}));

export const USER_TITLE_SKELETON_TEST_ID = "user-title-skeleton";

export interface UserSummaryProps {
  avatarIsLink?: boolean;
  children?: React.ReactNode;
  smallAvatar?: boolean;
  nameOnly?: boolean;
  headlineComponent?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  user?: User.AsObject;
  titleIsLink?: boolean;
}

export default function UserSummary({
  avatarIsLink = true,
  children,
  smallAvatar = false,
  nameOnly = false,
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
      noWrap={nameOnly}
    >
      {!user ? (
        <Skeleton
          className={classes.titleSkeleton}
          data-testid={USER_TITLE_SKELETON_TEST_ID}
        />
      ) : nameOnly ? (
        user.name
      ) : (
        `${user.name}, ${user.age}`
      )}
    </Typography>
  );

  const avatarClassNames = classNames(
    classes.avatar,
    smallAvatar ? classes.avatarSmall : classes.avatarBig
  );

  return (
    <div className={classes.root}>
      <ListItemAvatar>
        {!user ? (
          <Skeleton variant="circle" className={avatarClassNames} />
        ) : (
          <Avatar
            user={user}
            className={avatarClassNames}
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
            {!nameOnly && (
              <Typography
                color="textSecondary"
                variant="body1"
                noWrap={nameOnly}
              >
                {!user ? <Skeleton /> : user.city}
              </Typography>
            )}
            {process.env.REACT_APP_IS_VERIFICATION_ENABLED && (
              <ScoreBar value={(user?.communityStanding || 0) * 100}>
                {COMMUNITY_STANDING}
              </ScoreBar>
            )}
            {children}
          </>
        }
      />
    </div>
  );
}
