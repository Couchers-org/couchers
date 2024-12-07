import TextField from "@mui/material/TextField";
import { DatePicker, PickersDay } from "@mui/x-date-pickers";
import { useTranslation } from "i18n";
import { forwardRef } from "react";
import { Control, Controller, UseControllerProps } from "react-hook-form";
import { theme } from "theme";
import dayjs, { Dayjs } from "utils/dayjs";

import { dateFormats } from "./constants";

const getLocaleFormat = () => {
  return navigator.language in dateFormats
    ? dateFormats[navigator.language as keyof typeof dateFormats]
    : "DD/MM/YYYY";
};

interface DatepickerProps {
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
  minDate?: Dayjs;
  maxDate?: Dayjs;
  openTo?: "year" | "month" | "day";
  onPostChange?(date: Dayjs): void;
  testId?: string;
}

const Datepicker = forwardRef<HTMLInputElement, DatepickerProps>(
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
      minDate = dayjs(),
      maxDate,
      name,
      openTo = "day",
      onPostChange,
      testId,
    }: DatepickerProps,
    ref
  ) => {
    const { t } = useTranslation();
    return (
      <Controller
        control={control}
        defaultValue={defaultValue}
        name={name}
        rules={rules}
        render={({ field }) => (
          <DatePicker
            {...field}
            data-testid={testId}
            label={label}
            value={field.value}
            minDate={minDate}
            maxDate={maxDate}
            onChange={(date) => {
              if (date?.isValid()) {
                field.onChange(date);
                onPostChange?.(date);
              }
            }}
            openTo={openTo}
            views={["year", "month", "day"]}
            ref={ref}
            inputFormat={getLocaleFormat()}
            renderDay={(day, selectedDates, pickersDayProps) => {
              return (
                <PickersDay
                  {...pickersDayProps}
                  style={{
                    ...(pickersDayProps.selected && {
                      backgroundColor: theme.palette.primary.main, // make selected day our primary color
                    }),
                  }}
                />
              );
            }}
            renderInput={(props) => (
              <TextField
                {...props}
                fullWidth
                id={id}
                error={error}
                helperText={helperText}
                data-testid={testId}
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  ...props.InputProps,
                  className,
                  "aria-label": t("components.datepicker.change_date"),
                }}
                variant="standard"
              />
            )}
          />
        )}
      />
    );
  }
);

Datepicker.displayName = "Datepicker";

export default Datepicker;
