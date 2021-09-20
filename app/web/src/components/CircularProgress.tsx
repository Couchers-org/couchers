import {
  CircularProgress as MuiCircularProgress,
  CircularProgressProps,
} from "@material-ui/core";
import classNames from "classnames";
import React, { ForwardedRef } from "react";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {},
}));

function _CircularProgress(
  { className, ...otherProps }: CircularProgressProps,
  ref: ForwardedRef<any>
) {
  const classes = useStyles();
  return (
    <MuiCircularProgress
      {...otherProps}
      className={classNames(classes.root, className)}
      ref={ref}
    />
  );
}

const CircularProgress = React.forwardRef(_CircularProgress);
export default CircularProgress;
