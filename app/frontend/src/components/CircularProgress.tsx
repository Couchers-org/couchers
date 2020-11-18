import {
  CircularProgress as MuiCircularProgress,
  CircularProgressProps,
  makeStyles,
} from "@material-ui/core";
import classNames from "classnames";
import React from "react";

const useStyles = makeStyles({
  root: {},
});

export default function CircularProgress({
  className,
  ...otherProps
}: CircularProgressProps) {
  const classes = useStyles();
  return (
    <MuiCircularProgress
      {...otherProps}
      className={classNames(classes.root, className)}
    />
  );
}
