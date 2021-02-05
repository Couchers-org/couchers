import { makeStyles } from "@material-ui/core";
import {
  Alert as MuiAlert,
  AlertProps as MuiAlertProps,
} from "@material-ui/lab/";
import classNames from "classnames";
import React from "react";

const useStyles = makeStyles((theme) => ({
  root: {
    marginBottom: theme.spacing(2),
  },
}));

interface AlertProps extends MuiAlertProps {
  severity: MuiAlertProps["severity"];
}

export default function Alert({ className, ...otherProps }: AlertProps) {
  const classes = useStyles();
  return (
    <MuiAlert {...otherProps} className={classNames(classes.root, className)} />
  );
}
