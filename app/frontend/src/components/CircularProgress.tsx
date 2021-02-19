import {
  Box,
  CircularProgress as MuiCircularProgress,
  CircularProgressProps as MuiCircularProgressProps,
  makeStyles,
} from "@material-ui/core";
import classNames from "classnames";
import React, { ForwardedRef } from "react";

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(0.5),
    /// TODO: Not circular!! Why??
    width: "fit-content",
    height: "fit-content",
  },
  opaque: {
    borderRadius: "50%",
    backgroundColor: theme.palette.background.paper,
    border: "1px solid",
  },
}));

interface CircularProgressProps extends MuiCircularProgressProps {
  opaque?: boolean;
}

function _CircularProgress(
  { opaque = false, className, ...otherProps }: CircularProgressProps,
  ref: ForwardedRef<any>
) {
  const classes = useStyles();
  return (
    <Box
      className={classNames(
        { [classes.opaque]: opaque },
        classes.root,
        className
      )}
      ref={ref}
    >
      <MuiCircularProgress {...otherProps} />
    </Box>
  );
}

const CircularProgress = React.forwardRef(_CircularProgress);
export default CircularProgress;
