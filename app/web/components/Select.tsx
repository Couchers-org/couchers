import {
  FormControl,
  InputLabel,
  MenuItem,
  Select as MuiSelect,
  SelectChangeEvent,
  SelectProps,
} from "@mui/material";
import React, { forwardRef } from "react";

import { theme } from "@/theme";

const Select = forwardRef((
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
    value?: T extends undefined
      ? string | number | number[]
      : keyof T | Array<keyof T>;
    menuItems?: boolean;
    optionLabelMap: T;
    onChange?: (event: SelectChangeEvent<T>) => void;
  },
  ref: React.Ref<HTMLSelectElement>,
) => {
  const OptionComponent: React.ElementType = menuItems ? MenuItem : "option";

  return (
    <FormControl
      variant={variant}
      className={className}
      margin="normal"
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: theme.spacing(1.5),
          backgroundColor: theme.palette.common.white,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          transition: "all 0.2s ease-in-out",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.grey[300],
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.primary.main,
          },
          "&:hover": {
            backgroundColor: theme.palette.grey[50],
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.primary.main,
            borderWidth: "1px",
          },
          "&.Mui-focused": {
            boxShadow: `0 0 0 2px ${theme.palette.primary.main}15`,
          },
        },
        "& .MuiInputBase-input": {
          height: "auto",
          fontSize: "1rem",
          padding: theme.spacing(1.5, 2),
        },
        "& .MuiSelect-icon": {
          color: theme.palette.grey[600],
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
