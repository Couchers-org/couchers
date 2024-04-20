import {
  IconButton as MuiIconButton,
  IconButtonProps as MuiIconButtonProps,
  useTheme,
} from "@material-ui/core";
import { forwardRef } from "react";
import makeStyles from "utils/makeStyles";

import CircularProgress from "./CircularProgress";

const useStyles = makeStyles((theme) => ({
  circularProgress: {
    margin: 3,
  },
}));

interface IconButtonProps extends MuiIconButtonProps {
  "aria-label": string;
  loading?: boolean;
}

export default forwardRef(function IconButton(
  { loading, ...otherProps }: IconButtonProps,
  ref: IconButtonProps["ref"]
) {
  const classes = useStyles();
  const theme = useTheme();
  return (
    <MuiIconButton {...otherProps} ref={ref}>
      {loading ? (
        <CircularProgress
          className={classes.circularProgress}
          //stolen from source for MUI IconButton
          size={theme.typography.pxToRem(18)}
        />
      ) : (
        otherProps.children
      )}
    </MuiIconButton>
  );
});
