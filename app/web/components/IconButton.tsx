import {
  IconButton as MuiIconButton,
  IconButtonProps as MuiIconButtonProps,
  styled,
  useTheme,
} from "@mui/material";
import { forwardRef } from "react";

import CircularProgress from "./CircularProgress";

const StyledCircularProgress = styled(CircularProgress)(({ theme }) => ({
  margin: 3,
}));

interface IconButtonProps extends MuiIconButtonProps {
  "aria-label": string;
  loading?: boolean;
}

export default forwardRef(function IconButton(
  { loading, ...otherProps }: IconButtonProps,
  ref: IconButtonProps["ref"],
) {
  const theme = useTheme();
  return (
    <MuiIconButton {...otherProps} ref={ref}>
      {loading ? (
        <StyledCircularProgress size={theme.typography.pxToRem(18)} />
      ) : (
        otherProps.children
      )}
    </MuiIconButton>
  );
});
