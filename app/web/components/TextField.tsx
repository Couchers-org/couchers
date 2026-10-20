import { styled, TextField as MuiTextField, TextFieldProps } from "@mui/material";
import { BaseTextFieldProps } from "@mui/material/TextField";
import React, { forwardRef } from "react";
import { useIsNativeEmbed } from "utils/nativeLink";

const StyledMuiTextField = styled(MuiTextField)<TextFieldProps>(({ theme, multiline }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.shape.borderRadius * 3,
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "var(--mui-palette-grey-300)",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "var(--mui-palette-primary-main)",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "var(--mui-palette-primary-main)",
    },
  },
  display: "block",
  ...(multiline && {
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "var(--mui-palette-grey-500)",
    },
    "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "var(--mui-palette-grey-900)",
    },
  }),
}));

type AccessibleTextFieldProps = Omit<TextFieldProps, "variant"> & {
  // id is required for accessibility, but optional when used inside Autocomplete
  // (Autocomplete provides the id via inputProps)
  id?: BaseTextFieldProps["id"];
  onChange?: TextFieldProps["onChange"];
  variant?: "filled" | "outlined" | "standard";
};

const TextField = forwardRef<HTMLInputElement | HTMLDivElement, AccessibleTextFieldProps>(
  ({ className, variant = "outlined", helperText, name, slotProps, ...otherProps }, ref) => {
    // In WebViews, MUI's floating label positioning can break due to CSS transform issues.
    // Force labels to always be in "shrunk" position to avoid overlap with input border.
    const isNativeEmbed = useIsNativeEmbed();

    return (
      <StyledMuiTextField
        {...otherProps}
        inputRef={ref}
        name={name}
        variant={variant}
        helperText={<span data-testid={`${name}-helper-text`}>{helperText}</span>}
        multiline={otherProps.multiline !== undefined}
        className={className}
        slotProps={{
          ...slotProps,
          inputLabel: {
            ...(typeof slotProps?.inputLabel === "object" ? slotProps.inputLabel : {}),
            ...(isNativeEmbed && { shrink: true }),
          },
        }}
      />
    );
  },
);

TextField.displayName = "TextField";

export default TextField;
