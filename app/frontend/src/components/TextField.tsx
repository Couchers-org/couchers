import {
  makeStyles,
  OutlinedTextFieldProps,
  TextField as MuiTextField,
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
  ...otherProps
}: Omit<OutlinedTextFieldProps, "variant">) {
  const classes = useStyles();
  return (
    <MuiTextField
      {...otherProps}
      variant="outlined"
      className={classNames(classes.root, className, {
        [classes.multiline]: otherProps.multiline,
      })}
    />
  );
}
