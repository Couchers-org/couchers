import {
  makeStyles,
  TextField as MuiTextField,
  TextFieldProps,
} from "@material-ui/core";
import { BaseTextFieldProps } from "@material-ui/core/TextField";
import classNames from "classnames";
import React from "react";

const useStyles = makeStyles((theme) => ({
  multiline: {
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.grey[500],
    },
    "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.grey[900],
    },
  },
  root: {
    "& .MuiOutlinedInput-root": {
      borderRadius: theme.shape.borderRadius,
    },
    display: "block",
  },
}));

interface AccessibleTextFieldProps extends BaseTextFieldProps {
  id: BaseTextFieldProps["id"];
  onChange?: TextFieldProps["onChange"];
}

export default function TextField({
  id,
  className,
  variant = "outlined",
  ...otherProps
}: AccessibleTextFieldProps) {
  const classes = useStyles();
  return (
    <MuiTextField
      {...otherProps}
      variant={variant}
      id={id}
      className={classNames(classes.root, className, {
        [classes.multiline]: otherProps.multiline,
      })}
    />
  );
}
