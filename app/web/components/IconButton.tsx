import {
  IconButton as MuiIconButton,
  IconButtonProps as MuiIconButtonProps,
  styled,
  useTheme,
} from "@mui/material";
import { forwardRef } from "react";

import CircularProgress from "./CircularProgress";

const StyledCircularProgress = styled(CircularProgress)(() => ({
  margin: 3,
}));

interface IconButtonProps extends MuiIconButtonProps {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "aria-label": string;
  loading?: boolean;
}

const IconButton = forwardRef(
  (
    { loading, ...otherProps }: IconButtonProps,
    ref: IconButtonProps["ref"],
  ) => {
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
  },
);

IconButton.displayName = "IconButton";

export default IconButton;
