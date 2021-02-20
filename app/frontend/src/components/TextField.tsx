import {
  BaseTextFieldProps,
  makeStyles,
  OutlinedInputProps,
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

// todo: I had to do this because I wasn't able to select custom variant for TextField on login pages. Let me know how to do it properly ;)
interface NotInsaneTextFieldProps extends BaseTextFieldProps {
  onBlur?: OutlinedInputProps["onBlur"];
  onChange?: OutlinedInputProps["onChange"];
  onFocus?: OutlinedInputProps["onFocus"];
  InputProps?: Partial<OutlinedInputProps>;
  inputProps?: OutlinedInputProps["inputProps"];
}

export default function TextField({
  className,
  variant = "outlined",
  ...otherProps
}: NotInsaneTextFieldProps) {
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
