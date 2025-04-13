import TextField from "@mui/material/TextField";
import { TimePicker } from "@mui/x-date-pickers";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import React, { forwardRef, useRef } from "react";
import { Control, Controller, UseControllerProps } from "react-hook-form";
import { theme } from "theme";
import dayjs, { Dayjs } from "utils/dayjs";

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

const Timepicker = forwardRef<HTMLInputElement, TimepickerProps>(
  (
    {
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
    }: TimepickerProps,
    ref,
  ) => {
    const { t } = useTranslation([GLOBAL]);
    const inputRef = useRef<null | HTMLInputElement>(null);
    const anchorEl = useRef<null | HTMLDivElement>(null);

    return (
      <div ref={anchorEl}>
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
              value={field.value ? dayjs(field.value) : null}
              inputRef={field.ref}
              onChange={(time) => {
                field.onChange(time);
                onPostChange?.(time);
              }}
              renderInput={(props) => (
                <TextField
                  {...props}
                  fullWidth
                  defaultValue={defaultValue}
                  id={id}
                  inputRef={ref}
                  error={error}
                  helperText={
                    <span data-testid={`${name}-helper-text`}>
                      {helperText}
                    </span>
                  }
                  data-testid={testId}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    ...props.InputProps,
                    className,
                    inputRef: ref || inputRef,
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
              PopperProps={{
                anchorEl: anchorEl.current,
              }}
            />
          )}
        />
      </div>
    );
  },
);

Timepicker.displayName = "Timepicker";

export default Timepicker;
