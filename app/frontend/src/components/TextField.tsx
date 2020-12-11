import {
  makeStyles,
  TextField as MuiTextField,
  TextFieldProps,
} from "@material-ui/core";
import classNames from "classnames";
import React from "react";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "block",
    "& .MuiOutlinedInput-root": {
      borderRadius: theme.shape.borderRadius,
    },
  },
}));

export default function TextField({
  className,
  ...otherProps
}: TextFieldProps) {
  const classes = useStyles();
  return (
    <MuiTextField
      {...otherProps}
      className={classNames(classes.root, className)}
    />
  );
}
