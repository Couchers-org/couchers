import {
  CircularProgressProps,
  CircularProgress as MuiCircularProgress,
} from "@mui/material";
import React, { ForwardedRef } from "react";

const CircularProgress = React.forwardRef(
  (
    { className, ...otherProps }: CircularProgressProps,
    ref: ForwardedRef<HTMLElement>,
  ) => {
    return (
      <MuiCircularProgress {...otherProps} className={className} ref={ref} />
    );
  },
);

CircularProgress.displayName = "CircularProgress";

export default CircularProgress;
