import {
  CircularProgress as MuiCircularProgress,
  CircularProgressProps,
  styled,
} from "@mui/material";
import React, { ForwardedRef } from "react";

const StyledSpinnerWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  padding: theme.spacing(2),
  width: "100%",
}));

function _CenteredCircularProgress(
  { ...otherProps }: CircularProgressProps,
  ref: ForwardedRef<HTMLElement>
) {
  return (
    <StyledSpinnerWrapper>
      <MuiCircularProgress {...otherProps} ref={ref} />
    </StyledSpinnerWrapper>
  );
}

const CenteredCircularProgress = React.forwardRef(_CenteredCircularProgress);
export default CenteredCircularProgress;
