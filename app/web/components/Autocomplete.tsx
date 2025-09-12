import {
  Autocomplete as MuiAutocomplete,
  AutocompleteProps as MuiAutocompleteProps,
  Theme,
} from "@mui/material";
// eslint-disable-next-line no-restricted-imports
import { SystemStyleObject } from "@mui/system";
import React from "react";
import { ControllerRenderProps } from "react-hook-form";

import { SignupAccountInputs } from "@/features/auth/signup/AccountForm";
import { EditProfileFormValues } from "@/features/profile/edit/EditProfile";

import TextField from "./TextField";

export type AutocompleteProps<
  T,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined,
> = Omit<
  MuiAutocompleteProps<T, Multiple, DisableClearable, FreeSolo>,
  "renderInput" | "sx"
> & {
  id: string;
  error?: string;
  endAdornment?: React.ReactNode;
  label?: string;
  placeholder?: string;
  helperText?: string;
  variant?: "filled" | "standard" | "outlined" | undefined;
  sx?: SystemStyleObject<Theme>;
  inputProps?:
    | ControllerRenderProps<SignupAccountInputs, "location">
    | ControllerRenderProps<EditProfileFormValues, "location">;
};

const Autocomplete = <
  T,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined,
>({
  className,
  error,
  helperText,
  id,
  label,
  placeholder,
  variant = "standard",
  endAdornment,
  inputProps,
  sx,
  ...otherProps
}: AutocompleteProps<T, Multiple, DisableClearable, FreeSolo>) => {
  return (
    <MuiAutocomplete
      {...otherProps}
      options={otherProps.options}
      className={className}
      id={id}
      sx={{ display: "block", ...sx }}
      renderInput={(params) => (
        <TextField
          {...params}
          {...inputProps}
          variant={variant}
          error={!!error}
          label={label}
          placeholder={placeholder}
          helperText={error || helperText}
          slotProps={{
            input: endAdornment
              ? {
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {params.InputProps.endAdornment}
                      {endAdornment}
                    </>
                  ),
                }
              : params.InputProps,
          }}
        />
      )}
    ></MuiAutocomplete>
  );
};

export default Autocomplete;
