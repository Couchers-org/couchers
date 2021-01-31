import React from "react";
import {
  IconButton as MuiIconButton,
  IconButtonProps,
  makeStyles,
  useTheme,
} from "@material-ui/core";
import CircularProgress from "./CircularProgress";

const useStyles = makeStyles((theme) => ({
  circularProgress: {
    margin: 3,
  },
}));

export default function IconButton({
  loading,
  ...otherProps
}: IconButtonProps & { loading?: boolean }) {
  const classes = useStyles();
  const theme = useTheme();
  return (
    <MuiIconButton {...otherProps}>
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
}
