import { makeStyles } from "@material-ui/core";
import {
  Alert as MuiAlert,
  AlertProps as MuiAlertProps,
} from "@material-ui/lab/";
import React from "react";
import classNames from "classnames";

const useStyles = makeStyles({
  root: {},
});

interface AlertProps extends MuiAlertProps {
  severity: MuiAlertProps["severity"];
}

export default function Alert({ className, ...otherProps }: AlertProps) {
  const classes = useStyles();
  return (
    <MuiAlert {...otherProps} className={classNames(classes.root, className)} />
  );
}
