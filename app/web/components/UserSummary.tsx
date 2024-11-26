import {
  ListItemAvatar,
  ListItemText,
  Skeleton,
  Typography,
} from "@mui/material";
import classNames from "classnames";
import Avatar from "components/Avatar";
import { OpenInNewIcon } from "components/Icons";
import StyledLink from "components/StyledLink";
import { LiteUser } from "proto/api_pb";
import React from "react";
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
  linkIcon: {
    display: "block",
    marginInlineStart: theme.spacing(0.5),
    height: "1.25rem",
    width: "1.25rem",
  },
  titleAndBarContainer: {
    display: "grid",
    gap: theme.spacing(0.5),
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
  user?: LiteUser.AsObject;
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

  const headlineComponentWithRef = React.forwardRef(
    function HeadlineComponentWithRef(props, ref) {
      return React.createElement(headlineComponent, { ...props, ref });
    }
  );

  const title = (
    <Typography
      component={headlineComponentWithRef}
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
          <Skeleton variant="circular" className={avatarClassNames} />
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
            <StyledLink
              href={routeToUser(user.username)}
              target="_blank"
              rel="noopener noreferrer"
              className={classes.link}
            >
              {title}
              <OpenInNewIcon className={classes.linkIcon} />
            </StyledLink>
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
            {children}
          </>
        }
      />
    </div>
  );
}
