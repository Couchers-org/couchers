import {
  styled,
  TextField as MuiTextField,
  TextFieldProps,
} from "@mui/material";
import { BaseTextFieldProps } from "@mui/material/TextField";
import React, { forwardRef } from "react";

const StyledMuiTextField = styled(MuiTextField)<TextFieldProps>(
  ({ theme, multiline }) => ({
    "& .MuiOutlinedInput-root": {
      borderRadius: theme.shape.borderRadius * 3,
    },
    display: "block",
    ...(multiline && {
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.grey[500],
      },
      "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.grey[900],
      },
    }),
  }),
);

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
    return (
      <StyledMuiTextField
        {...otherProps}
        inputRef={ref}
        name={name}
        variant={variant}
        helperText={
          <span data-testid={`${name}-helper-text`}>{helperText}</span>
        }
        multiline={otherProps.multiline !== undefined}
        className={className}
      />
    );
  },
);

TextField.displayName = "TextField";

export default TextField;
