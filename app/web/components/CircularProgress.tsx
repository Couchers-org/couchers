import {
  CircularProgress as MuiCircularProgress,
  CircularProgressProps,
} from "@mui/material";
import React, { ForwardedRef } from "react";

function _CircularProgress(
  { className, ...otherProps }: CircularProgressProps,
  ref: ForwardedRef<HTMLElement>,
) {
  return (
    <MuiCircularProgress {...otherProps} className={className} ref={ref} />
  );
}

const CircularProgress = React.forwardRef(_CircularProgress);
export default CircularProgress;
