import {
  makeStyles,
  TextField as MuiTextField,
  TextFieldProps,
} from "@material-ui/core";
import classNames from "classnames";
import React from "react";

const useStyles = makeStyles({
  root: {
    display: "block",
    "& .MuiOutlinedInput-root": {
      borderRadius: 10,
    },
  },
});

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
