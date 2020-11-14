import {
  makeStyles,
  Button as MuiButton,
  ButtonProps,
  CircularProgress,
  Box,
} from "@material-ui/core";
import React from "react";
import classNames from "classnames";

const useStyles = makeStyles({
  root: {},
});

type AppButtonProps = ButtonProps & {
  loading?: boolean;
};

export default function Button({
  children,
  disabled,
  className,
  loading,
  ...otherProps
}: AppButtonProps) {
  const classes = useStyles();
  return (
    <MuiButton
      {...otherProps}
      disabled={disabled ? true : loading}
      className={classNames(classes.root, className)}
    >
      {children}
      {loading && (
        <Box marginLeft="8px">
          <CircularProgress />
        </Box>
      )}
    </MuiButton>
  );
}
