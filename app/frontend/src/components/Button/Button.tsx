import {
  makeStyles,
  Button as MuiButton,
  ButtonProps,
  CircularProgress,
  Box,
} from "@material-ui/core";
import React, { ElementType, useState } from "react";
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
  onClick,
  ...otherProps
}: AppButtonProps<D, P>) {
  const [waiting, setWaiting] = useState(false);
  const classes = useStyles();
  async function asyncOnClick(event: any) {
    try {
      setWaiting(true);
      await onClick(event);
    } finally {
      setWaiting(false);
    }
  }
  return (
    <MuiButton
      {...otherProps}
      onClick={onClick && asyncOnClick}
      disabled={disabled ? true : loading || waiting}
      className={classNames(classes.root, className)}
    >
      {children}
      {(loading || waiting) && (
        <Box marginLeft="8px">
          <CircularProgress />
        </Box>
      )}
    </MuiButton>
  );
}
