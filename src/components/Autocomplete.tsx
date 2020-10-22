import { makeStyles } from "@material-ui/core";
import { Autocomplete, AutocompleteProps } from "@material-ui/lab";
import React from "react";
import TextInput from "./TextInput";

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

export default function <
  T,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined
>(props: AppAutocompleteProps<T, Multiple, DisableClearable, FreeSolo>) {
  const styles = useStyles();

  const { label, options, ...otherProps } = props;

  return (
    <Autocomplete
      {...otherProps}
      options={options}
      className={`${styles.root} ${props.className}`}
      renderInput={(params) => <TextInput {...params} label={label} />}
    ></Autocomplete>
  );
}
