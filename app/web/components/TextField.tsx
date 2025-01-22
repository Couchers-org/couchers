import { TextField as MuiTextField, TextFieldProps } from "@mui/material";
import { BaseTextFieldProps } from "@mui/material/TextField";
import classNames from "classnames";
import React, { forwardRef } from "react";
import makeStyles from "utils/makeStyles";

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
      borderRadius: theme.shape.borderRadius * 3,
    },
    display: "block",
  },
}));

type AccessibleTextFieldProps = Omit<TextFieldProps, "variant"> & {
  id: BaseTextFieldProps["id"];
  onChange?: TextFieldProps["onChange"];
  variant?: "filled" | "outlined" | "standard";
};

const TextField = forwardRef<
  HTMLInputElement | HTMLDivElement,
  AccessibleTextFieldProps
>(
  (
    { className, variant = "outlined", helperText, name, ...otherProps },
    ref,
  ) => {
    const classes = useStyles();

    return (
      <MuiTextField
        {...otherProps}
        inputRef={ref}
        name={name}
        variant={variant}
        helperText={
          <span data-testid={`${name}-helper-text`}>{helperText}</span>
        }
        className={classNames(classes.root, className, {
          [classes.multiline]: otherProps.multiline,
        })}
      />
    );
  },
);

TextField.displayName = "TextField";

export default TextField;
