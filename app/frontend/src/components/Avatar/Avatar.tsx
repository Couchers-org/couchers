import { Avatar as MuiAvatar, Box, BoxProps } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Skeleton } from "@material-ui/lab";
import classNames from "classnames";
import React from "react";
import { Link } from "react-router-dom";

import { routeToUser } from "../../AppRoutes";
import { User } from "../../pb/api_pb";

const useStyles = makeStyles({
  root: {
    position: "relative",
    flexShrink: 0,
  },
  defaultSize: {
    height: "3rem",
    width: "3rem",
  },
  grow: {
    height: 0,
    width: "100%",
    paddingTop: "100%",
  },
  avatar: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
  },
});

export interface AvatarProps extends BoxProps {
  user?: User.AsObject;
  grow?: boolean;
  className?: string;
  isProfileLink?: boolean;
}

export default function Avatar({
  user,
  grow,
  className,
  isProfileLink = true,
  ...otherProps
}: AvatarProps) {
  const classes = useStyles();

  const muiAvatar = (user: User.AsObject) => (
    <MuiAvatar className={classes.avatar} alt={user.name} src={user.avatarUrl}>
      {user.name.split(/\s+/).map((name) => name[0])}
    </MuiAvatar>
  );

  return (
    <Box
      className={classNames(
        className,
        { [classes.defaultSize]: !className },
        classes.root,
        { [classes.grow]: grow }
      )}
      {...otherProps}
    >
      {user ? (
        isProfileLink ? (
          <Link to={routeToUser(user)}>{muiAvatar(user)}</Link>
        ) : (
          muiAvatar(user)
        )
      ) : otherProps.children ? (
        <MuiAvatar className={classes.avatar}>{otherProps.children}</MuiAvatar>
      ) : (
        <Skeleton variant="circle" className={classes.avatar} />
      )}
    </Box>
  );
}
