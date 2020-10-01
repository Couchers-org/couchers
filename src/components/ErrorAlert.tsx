import { makeStyles } from "@material-ui/core";
import { Alert, AlertProps } from "@material-ui/lab/";
import React from "react";

const useStyles = makeStyles({
  root: {},
});

type ErrorAlertProps = AlertProps & {
  error: string;
};

export default (props: ErrorAlertProps) => {
  const { error, className, ...otherProps } = props;

  const styles = useStyles();
  return (
    <Alert
      severity="error"
      {...otherProps}
      className={`${styles.root} ${className}`}
    >
      {error}
    </Alert>
  );
};
