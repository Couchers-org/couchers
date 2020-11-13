import { makeStyles } from "@material-ui/core";
import {
  Alert as MuiAlert,
  AlertProps as MuiAlertProps,
} from "@material-ui/lab/";
import React from "react";

const useStyles = makeStyles({
  root: {},
});

type AlertProps = MuiAlertProps & {
  children: React.ReactNode;
  severity: MuiAlertProps["severity"];
};

export default function Alert(props: AlertProps) {
  const { children, className, severity, ...otherProps } = props;

  const styles = useStyles();
  return (
    <MuiAlert
      severity={severity}
      {...otherProps}
      className={`${styles.root} ${className}`}
    >
      {children}
    </MuiAlert>
  );
}
