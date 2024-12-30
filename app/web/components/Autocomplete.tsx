import {
  Autocomplete as MuiAutocomplete,
  AutocompleteProps as MuiAutocompleteProps,
} from "@mui/material";
import classNames from "classnames";
import { SignupAccountInputs } from "features/auth/signup/AccountForm";
import { EditProfileFormValues } from "features/profile/edit/EditProfile";
import React from "react";
import { ControllerRenderProps } from "react-hook-form";
import makeStyles from "utils/makeStyles";

import TextField from "./TextField";

const useStyles = makeStyles({
  root: {
    display: "block",
  },
});

export type AutocompleteProps<
  T,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined
> = Omit<
  MuiAutocompleteProps<T, Multiple, DisableClearable, FreeSolo>,
  "renderInput"
> & {
  id: string;
  error?: string;
  endAdornment?: React.ReactNode;
  label?: string;
  placeholder?: string;
  helperText?: string;
  variant?: "filled" | "standard" | "outlined" | undefined;
  inputProps?:
    | ControllerRenderProps<SignupAccountInputs, "location">
    | ControllerRenderProps<EditProfileFormValues, "location">;
};

export default function Autocomplete<
  T,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined
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
  ...otherProps
}: AutocompleteProps<T, Multiple, DisableClearable, FreeSolo>) {
  const classes = useStyles();

  return (
    <MuiAutocomplete
      {...otherProps}
      options={otherProps.options}
      className={classNames(classes.root, className)}
      id={id}
      renderInput={(params) => (
        <TextField
          {...params}
          {...inputProps}
          variant={variant}
          error={!!error}
          label={label}
          placeholder={placeholder}
          helperText={error || helperText}
          InputProps={
            endAdornment
              ? {
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {params.InputProps.endAdornment}
                      {endAdornment}
                    </>
                  ),
                }
              : params.InputProps
          }
        />
      )}
    ></MuiAutocomplete>
  );
}
