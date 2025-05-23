import TextField from "@mui/material/TextField";
import { TimePicker } from "@mui/x-date-pickers";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import React from "react";
import { Control, Controller, UseControllerProps } from "react-hook-form";
import { theme } from "theme";
import { Dayjs } from "utils/dayjs";

interface TimepickerProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  defaultValue?: Dayjs | null;
  error: boolean;
  helperText: React.ReactNode;
  id: string;
  rules?: UseControllerProps["rules"];
  label?: string;
  name: string;
  onPostChange?(time: Dayjs | null): void;
  testId?: string;
}

const Timepicker = ({
  className,
  control,
  defaultValue,
  error,
  helperText,
  id,
  rules,
  label,
  name,
  onPostChange,
  testId,
}: TimepickerProps) => {
  const { t } = useTranslation([GLOBAL]);

  return (
    <Controller
      control={control}
      defaultValue={defaultValue}
      name={name}
      rules={rules}
      render={({ field }) => (
        <TimePicker
          data-testid={testId}
          {...field}
          label={label}
          value={field.value}
          onChange={(time) => {
            field.onChange(time);
            onPostChange?.(time);
          }}
          renderInput={(props) => (
            <TextField
              {...props}
              fullWidth
              id={id}
              error={error}
              helperText={
                <span data-testid={`${name}-helper-text`}>{helperText}</span>
              }
              data-testid={testId}
              InputLabelProps={{
                shrink: true,
              }}
              InputProps={{
                ...props.InputProps,
                className,
                "aria-label": t("global:change_time"),
              }}
              variant="standard"
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.text.primary,
                },
                "& .MuiPaper-root": {
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.text.primary,
                },
              }}
            />
          )}
        />
      )}
    />
  );
};

export default Timepicker;
