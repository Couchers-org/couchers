import {
  FormControl,
  InputLabel,
  MenuItem,
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

export default function Select<T extends Record<string | number, string>>({
  id,
  className,
  native = true,
  menuItems = false,
  optionLabelMap,
  label,
  variant = "outlined",
  options,
  ...otherProps
}: Omit<SelectProps, "children"> & {
  id: string;
  options: Extract<keyof T, string | number>[];
  value?: T extends undefined
    ? string | number | number[]
    : keyof T | Array<keyof T>;
  menuItems?: boolean;
  optionLabelMap: T;
}) {
  const classes = useStyles();
  const OptionComponent = menuItems
    ? MenuItem
    : ("option" as unknown as React.ElementType);

  return (
    <FormControl
      variant={variant}
      className={classnames(className, classes.formControl)}
      margin="normal"
    >
      <InputLabel htmlFor={id}>{label}</InputLabel>
      <MuiSelect
        native={native}
        label={label}
        {...otherProps}
        inputProps={{
          name: id,
          id,
        }}
      >
        {options.map((option) => (
          <OptionComponent value={option} key={option}>
            {optionLabelMap[option]}
          </OptionComponent>
        ))}
      </MuiSelect>
    </FormControl>
  );
}
