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
  label: string;
  helperText?: string;
};

export default function Autocomplete<
  T,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined
>({
  label,
  helperText,
  className,
  ...otherProps
}: AutocompleteProps<T, Multiple, DisableClearable, FreeSolo>) {
  const classes = useStyles();

  return (
    <MuiAutocomplete
      {...otherProps}
      className={classNames(classes.root, className)}
      renderInput={(params) => (
        <TextField
          variant="standard"
          {...params}
          label={label}
          helperText={helperText}
        />
      )}
    ></MuiAutocomplete>
  );
}
