import { makeStyles } from "@material-ui/core";
import {
  Alert as MuiAlert,
  AlertProps as MuiAlertProps,
} from "@material-ui/lab/";
import classNames from "classnames";
import React from "react";

import { grpcErrorStrings } from "../constants";

const useStyles = makeStyles((theme) => ({
  root: {
    marginBottom: theme.spacing(2),
  },
}));

interface AlertProps extends MuiAlertProps {
  severity: MuiAlertProps["severity"];
}

export default function Alert({
  className,
  children,
  ...otherProps
}: AlertProps) {
  const classes = useStyles();

  return (
    <MuiAlert {...otherProps} className={classNames(classes.root, className)}>
      {React.Children.map(children, (child) => {
        if (typeof child !== "string")
          throw new Error("Alert should only have string children");

        // Search for the error in the ugly grpc error object keys
        // Replace it with the nice error if found
        const oldErrorKey = Object.keys(grpcErrorStrings).find((oldError) =>
          child.includes(oldError)
        );
        if (oldErrorKey)
          return grpcErrorStrings[oldErrorKey as keyof typeof grpcErrorStrings];
        else return child;
      })}
    </MuiAlert>
  );
}
