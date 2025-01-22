import TextField from "@mui/material/TextField";
import { DatePicker, PickersDay } from "@mui/x-date-pickers";
import { useTranslation } from "i18n";
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
  onPostChange?(date: Dayjs | null): void;
  testId?: string;
}

const Datepicker = ({
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
}: DatepickerProps) => {
  const { t } = useTranslation();
  return (
    <Controller
      control={control}
      defaultValue={defaultValue}
      name={name}
      rules={rules}
      render={({ field }) => (
        <DatePicker
          data-testid={testId}
          {...field}
          label={label}
          value={field.value}
          minDate={minDate}
          maxDate={maxDate}
          onChange={(date) => {
            field.onChange(date);
            onPostChange?.(date);
          }}
          openTo={openTo}
          views={["year", "month", "day"]}
          inputFormat={getLocaleFormat()}
          renderDay={(day, selectedDates, pickersDayProps) => {
            const { key, ...otherProps } = pickersDayProps;
            return (
              <PickersDay
                key={key} // Pass key explicitly to make React happy
                {...otherProps}
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
                "aria-label": t("components.datepicker.change_date"),
              }}
              variant="standard"
            />
          )}
        />
      )}
    />
  );
};

export default Datepicker;
