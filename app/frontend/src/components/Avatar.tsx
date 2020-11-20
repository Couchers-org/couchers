import {
  Avatar as MuiAvatar,
  AvatarProps as MuiAvatarProps,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import classNames from "classnames";
import React from "react";
import { User } from "../pb/api_pb";

const useStyles = makeStyles({ root: {} });

export interface AvatarProps extends MuiAvatarProps {
  user: User.AsObject;
}

export default function Avatar({ user, className }: AvatarProps) {
  const classes = useStyles();
  return (
    <MuiAvatar
      className={classNames([className, classes.root])}
      src={user.avatarUrl}
    />
  );
}
