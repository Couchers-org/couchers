import {
  FormControl,
  InputLabel,
  Select as MuiSelect,
  SelectProps,
} from "@material-ui/core";
import classnames from "classnames";
import React from "react";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  formControl: {
    "& .MuiOutlinedInput-root": {
      borderRadius: theme.shape.borderRadius * 3,
    },
    "& .MuiInputBase-input": {
      height: "auto",
    },
    display: "block",
  },
}));

export default function Select({
  id,
  children,
  className,
  label,
  variant = "outlined",
  options,
  ...otherProps
}: SelectProps & {
  id: string;
  options?: { label: string; value: string | number }[];
}) {
  const classes = useStyles();
  return (
    <FormControl
      variant={variant}
      className={classnames(className, classes.formControl)}
      margin="normal"
    >
      <InputLabel htmlFor={id}>{label}</InputLabel>
      <MuiSelect
        native
        label={label}
        {...otherProps}
        inputProps={{
          name: id,
          id,
        }}
      >
        {options &&
          options.map(({ value, label }) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        {children}
      </MuiSelect>
    </FormControl>
  );
}
