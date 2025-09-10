import { TimePicker } from "@mui/x-date-pickers";
import React, { useMemo } from "react";
import {
  Control,
  Controller,
  FieldValues,
  Path,
  RegisterOptions,
} from "react-hook-form";

import { useTranslation } from "@/i18n";
import { GLOBAL } from "@/i18n/namespaces";
import { theme } from "@/theme";
import { Dayjs } from "@/utils/dayjs";
import { KeysWithType } from "@/utils/types";

type DayjsPath<T> = Extract<KeysWithType<T, Dayjs>, Path<T>>;

interface TimepickerProps<
  TFieldValues extends FieldValues,
  TName extends DayjsPath<TFieldValues> = DayjsPath<TFieldValues>,
> {
  className?: string;
  control: Control<TFieldValues>;
  defaultValue?: TFieldValues[TName];
  error: boolean;
  helperText: React.ReactNode;
  id: string;
  rules?: RegisterOptions<TFieldValues, TName>;
  label?: string;
  name: TName;
  onPostChange?: (time: TFieldValues[TName]) => void;
  testId?: string;
}

const uses24HourClock = (locale: string = navigator.language): boolean => {
  const formatted = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    hour12: undefined,
  }).format(new Date(2020, 0, 1, 23, 0));
  return formatted.includes("23");
};

const Timepicker = <
  TFieldValues extends FieldValues,
  TName extends DayjsPath<TFieldValues> = DayjsPath<TFieldValues>,
>({
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
}: TimepickerProps<TFieldValues, TName>) => {
  const { t } = useTranslation([GLOBAL]);
  const locale = navigator.language;
  const is24HourClock = useMemo(() => uses24HourClock(locale), [locale]);
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
            if (time) {
              onPostChange?.(time as TFieldValues[TName]);
            }
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
              /* eslint-disable @typescript-eslint/naming-convention */
              InputProps: {
                className,
                "aria-label": t("global:change_time"),
              },
              InputLabelProps: { shrink: true },
              /* eslint-enable @typescript-eslint/naming-convention */
              sx: {
                "& .MuiOutlinedInput-root": {
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.text.primary,
                },
                "& .MuiPaper-root": {
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.text.primary,
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
