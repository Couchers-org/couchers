import { Box, BoxProps } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import classNames from "classnames";
import React from "react";
import { User } from "../../../pb/api_pb";

const useStyles = makeStyles({ root: {} });

export interface UserNameProps extends BoxProps {
  user: User.AsObject;
}

export default function UserName({
  user,
  className,
  ...otherProps
}: UserNameProps) {
  const classes = useStyles();
  return (
    <Box {...otherProps} className={classNames(classes.root, className)}>
      {user.name}
    </Box>
  );
}
