import { Autocomplete as MuiAutocomplete, AutocompleteProps as MuiAutocompleteProps } from "@mui/material";
import React from "react";

import TextField from "./TextField";

type AutocompleteProps<
  T,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined,
> = Omit<MuiAutocompleteProps<T, Multiple, DisableClearable, FreeSolo>, "renderInput"> & {
  id: string;
  error?: string;
  endAdornment?: React.ReactNode;
  label?: string;
  placeholder?: string;
  helperText?: string;
  variant?: "filled" | "standard" | "outlined" | undefined;
};

export default function Autocomplete<
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
  sx,
  ...otherProps
}: AutocompleteProps<T, Multiple, DisableClearable, FreeSolo>) {
  return (
    <MuiAutocomplete
      {...otherProps}
      options={otherProps.options}
      className={className}
      id={id}
      sx={{
        display: "block",
        // Override MUI's absolute positioning so X appears before search icon
        "& .MuiAutocomplete-endAdornment": {
          position: "static",
          transform: "none",
        },
        // Remove extra padding MUI adds for absolutely-positioned icons
        "&.MuiAutocomplete-hasPopupIcon .MuiOutlinedInput-root, &.MuiAutocomplete-hasClearIcon .MuiOutlinedInput-root":
          {
            paddingRight: "9px",
          },
        ...sx,
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          variant={variant}
          error={!!error}
          label={label}
          placeholder={placeholder}
          helperText={error || helperText}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              endAdornment: (
                <>
                  {params.slotProps.input.endAdornment}
                  {endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    ></MuiAutocomplete>
  );
}
