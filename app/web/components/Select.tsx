import { FormControl, InputLabel, MenuItem, Select as MuiSelect, SelectChangeEvent, SelectProps } from "@mui/material";
import React, { forwardRef } from "react";
import { theme } from "theme";

const Select = forwardRef(function Select<T extends Record<string | number, string>>(
  {
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
    value?: T extends undefined ? string | number | number[] : keyof T | Array<keyof T>;
    menuItems?: boolean;
    optionLabelMap: T;
    onChange?: (event: SelectChangeEvent<T>) => void;
  },
  ref: React.Ref<HTMLSelectElement>,
) {
  const OptionComponent: React.ElementType = menuItems ? MenuItem : "option";

  return (
    <FormControl
      variant={variant}
      className={className}
      margin="normal"
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: theme.spacing(1.5),
          backgroundColor: "var(--mui-palette-background-paper)",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          transition: "all 0.2s ease-in-out",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--mui-palette-grey-300)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--mui-palette-primary-main)",
          },
          "&:hover": {
            backgroundColor: "var(--mui-palette-grey-50)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--mui-palette-primary-main)",
            borderWidth: "1px",
          },
          "&.Mui-focused": {
            boxShadow: `0 0 0 2px var(--mui-palette-primary-main)15`,
          },
        },
        "& .MuiInputBase-input": {
          height: "auto",
          fontSize: "1rem",
          padding: theme.spacing(1.5, 2),
          color: "var(--mui-palette-text-primary)",
        },
        "& .MuiSelect-icon": {
          color: "var(--mui-palette-text-secondary)",
        },
        display: "block",
      }}
    >
      <InputLabel htmlFor={id}>{label}</InputLabel>
      <MuiSelect
        inputRef={ref}
        variant={variant}
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
});

export default Select;
