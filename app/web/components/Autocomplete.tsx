import {
  Autocomplete as MuiAutocomplete,
  AutocompleteProps as MuiAutocompleteProps,
} from "@material-ui/lab";
import classNames from "classnames";
import React from "react";
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
  label: string;
  helperText?: string;
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
  endAdornment,
  ...otherProps
}: AutocompleteProps<T, Multiple, DisableClearable, FreeSolo>) {
  const classes = useStyles();

  return (
    <MuiAutocomplete
      {...otherProps}
      className={classNames(classes.root, className)}
      id={id}
      renderInput={(params) => (
        <TextField
          variant="standard"
          {...params}
          error={!!error}
          label={label}
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
