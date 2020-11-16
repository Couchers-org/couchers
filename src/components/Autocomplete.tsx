import { makeStyles } from "@material-ui/core";
import {
  Autocomplete as MuiAutocomplete,
  AutocompleteProps,
} from "@material-ui/lab";
import React from "react";
import TextInput from "./TextField";
import classNames from "classnames";

const useStyles = makeStyles({
  root: {
    display: "block",
  },
});

type AppAutocompleteProps<
  T,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined
> = Omit<
  AutocompleteProps<T, Multiple, DisableClearable, FreeSolo>,
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
  options,
  className,
  ...otherProps
}: AppAutocompleteProps<T, Multiple, DisableClearable, FreeSolo>) {
  const classes = useStyles();

  return (
    <MuiAutocomplete
      {...otherProps}
      options={options}
      className={classNames(classes.root, className)}
      renderInput={(params) => <TextInput {...params} label={label} />}
    ></MuiAutocomplete>
  );
}
