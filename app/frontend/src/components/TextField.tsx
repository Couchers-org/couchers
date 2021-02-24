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
  multiline: {
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.grey[900],
    },
    "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.grey[500],
    },
  },
}));

export default function TextField({
  className,
  variant = "outlined",
  ...otherProps
}: TextFieldProps) {
  const classes = useStyles();
  return (
    <MuiTextField
      {...otherProps}
      variant={variant}
      className={classNames(classes.root, className, {
        [classes.multiline]: otherProps.multiline,
      })}
    />
  );
}
