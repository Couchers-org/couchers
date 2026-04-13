import { TimePicker } from "@mui/x-date-pickers";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import React, { useMemo } from "react";
import { Control, Controller, UseControllerProps } from "react-hook-form";
import { uses24HourClock } from "utils/date";
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
  const { t, i18n } = useTranslation([GLOBAL]);
  const is24HourClock = useMemo(
    () => uses24HourClock(i18n.language),
    [i18n.language],
  );
  const format = is24HourClock ? "HH:mm" : "h:mm a";

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
          onChange={(time: Dayjs | null) => {
            field.onChange(time);
            onPostChange?.(time);
          }}
          format={format}
          slotProps={{
            textField: {
              fullWidth: true,
              id,
              error,
              helperText: (
                <span data-testid={`${name}-helper-text`}>{helperText}</span>
              ),
              variant: "standard",
              InputProps: {
                className,
                "aria-label": t("global:change_time"),
              },
              slotProps: { inputLabel: { shrink: true } },
              sx: {
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "var(--mui-palette-primary-main)",
                  color: "var(--mui-palette-text-primary)",
                },
                "& .MuiPaper-root": {
                  backgroundColor: "var(--mui-palette-primary-main)",
                  color: "var(--mui-palette-text-primary)",
                },
              },
            },
          }}
        />
      )}
    />
  );
};

export default Timepicker;
