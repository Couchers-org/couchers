import { makeStyles } from "@material-ui/core";
import {
  Alert as MuiAlert,
  AlertProps as MuiAlertProps,
} from "@material-ui/lab/";
import classNames from "classnames";
import grpcErrorStrings from "constants";
import React from "react";

const useStyles = makeStyles((theme) => ({
  root: {
    marginBottom: theme.spacing(2),
  },
}));

interface AlertProps extends MuiAlertProps {
  severity: MuiAlertProps["severity"];
  children: string;
}

export default function Alert({
  className,
  children,
  ...otherProps
}: AlertProps) {
  const classes = useStyles();

  const oldErrorKey = Object.keys(grpcErrorStrings).find((oldError) =>
    children.includes(oldError)
  );

  return (
    <MuiAlert {...otherProps} className={classNames(classes.root, className)}>
      {
        // Search for the error in the ugly grpc error object keys
        // Replace it with the nice error if found
        oldErrorKey
          ? grpcErrorStrings[oldErrorKey as keyof typeof grpcErrorStrings]
          : children
      }
    </MuiAlert>
  );
}
