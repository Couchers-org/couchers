import {
  Button as MuiButton,
  ButtonProps,
  makeStyles,
  useTheme,
} from "@material-ui/core";
import classNames from "classnames";
import React, { ElementType } from "react";

import { useIsMounted, useSafeState } from "../../utils/hooks";
import CircularProgress from "../CircularProgress";

const useStyles = makeStyles((theme) => ({
  contained: {
    borderRadius: `${theme.shape.borderRadius * 2}px`,
    boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.25)",
  },
  loading: {
    height: theme.typography.button.fontSize,
  },
  root: {
    minHeight: `calc(calc(${theme.typography.button.lineHeight} * ${
      theme.typography.button.fontSize
    }) + ${theme.typography.pxToRem(12)})`, //from padding
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
  variant = "contained",
  color = "primary",
  ...otherProps
}: AppButtonProps<D, P>) {
  const isMounted = useIsMounted();
  const [waiting, setWaiting] = useSafeState(isMounted, false);
  const classes = useStyles();
  const theme = useTheme();
  async function asyncOnClick(event: any) {
    try {
      setWaiting(true);
      await onClick(event);
    } finally {
      setWaiting(false);
    }
  }
  if (variant !== "contained" && color !== "primary") {
    throw new Error("Only contained buttons should have color.");
  }
  return (
    <MuiButton
      {...otherProps}
      onClick={onClick && asyncOnClick}
      disabled={disabled ? true : loading || waiting}
      className={classNames(classes.root, className, {
        [classes.contained]: variant === "contained",
      })}
      variant={variant}
      color={variant === "contained" ? color : undefined}
    >
      {loading || waiting ? (
        <CircularProgress size={theme.typography.button.fontSize} />
      ) : (
        children
      )}
    </MuiButton>
  );
}
