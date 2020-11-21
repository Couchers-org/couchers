import {
  Avatar as MuiAvatar,
  AvatarProps as MuiAvatarProps,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { User } from '../pb/api_pb';

const useStyles = makeStyles({ root: { height: '3em', width: '3em', fontSize: 'unset' } });

export interface AvatarProps extends MuiAvatarProps {
  user: User.AsObject;
}

export default function Avatar({ user, ...otherProps }: AvatarProps) {
  const classes = useStyles();
  return <MuiAvatar {...otherProps} className={classes.root} src={user.avatarUrl} />;
}
