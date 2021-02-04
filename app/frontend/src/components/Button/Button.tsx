import {
  Button as MuiButton,
  ButtonProps,
  makeStyles,
} from "@material-ui/core";
import classNames from "classnames";
import React, { ElementType } from "react";

import { useIsMounted, useSafeState } from "../../utils/hooks";
import CircularProgress from "../CircularProgress";

const useStyles = makeStyles((theme) => ({
  root: {
    borderRadius: `${theme.shape.borderRadius}px`,
  },
  loading: {
    marginLeft: theme.spacing(1),
  },
}));

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
  const isMounted = useIsMounted();
  const [waiting, setWaiting] = useSafeState(isMounted, false);
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
      {(loading || waiting) && <CircularProgress className={classes.loading} />}
    </MuiButton>
  );
}
