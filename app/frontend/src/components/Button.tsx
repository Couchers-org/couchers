import {
  makeStyles,
  Button as MuiButton,
  ButtonProps,
  CircularProgress,
  Box,
} from "@material-ui/core";
import React, { ElementType } from "react";
import classNames from "classnames";

const useStyles = makeStyles({
  root: {},
});

//type generics required to allow component prop
//see https://github.com/mui-org/material-ui/issues/15827
type AppButtonProps<D extends ElementType = "button", P = {}> = ButtonProps<
  D,
  P
> & {
  loading?: boolean;
};

export default function Button<D extends ElementType = "button", P = {}>({
  children,
  disabled,
  className,
  loading,
  ...otherProps
}: AppButtonProps<D, P>) {
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
