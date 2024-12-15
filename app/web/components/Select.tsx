import {
  FormControl,
  InputLabel,
  MenuItem,
  Select as MuiSelect,
  SelectChangeEvent,
  SelectProps,
} from "@mui/material";
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
  onChange,
  ...otherProps
}: Omit<SelectProps, "children"> & {
  id: string;
  options: Extract<keyof T, string | number>[];
  value?: T extends undefined
    ? string | number | number[]
    : keyof T | Array<keyof T>;
  menuItems?: boolean;
  optionLabelMap: T;
  onChange?: (event: SelectChangeEvent<T>) => void;
}) {
  const classes = useStyles();
  const OptionComponent: React.ElementType = menuItems ? MenuItem : "option";

  return (
    <FormControl
      variant={variant}
      className={classnames(className, classes.formControl)}
      margin="normal"
    >
      <InputLabel htmlFor={id}>{label}</InputLabel>
      <MuiSelect
        variant="standard"
        native={native}
        label={label}
        onChange={onChange}
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
