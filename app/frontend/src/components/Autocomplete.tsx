import { makeStyles } from "@material-ui/core";
import {
  Autocomplete as MuiAutocomplete,
  AutocompleteProps as MuiAutocompleteProps,
} from "@material-ui/lab";
import React from "react";
import TextInput from "./TextField";
import classNames from "classnames";

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
};

export default function Autocomplete<
  T,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined
>({
  label,
  className,
  ...otherProps
}: AutocompleteProps<T, Multiple, DisableClearable, FreeSolo>) {
  const classes = useStyles();

  return (
    <MuiAutocomplete
      {...otherProps}
      className={classNames(classes.root, className)}
      renderInput={(params) => <TextInput {...params} label={label} />}
    ></MuiAutocomplete>
  );
}
