import TextField from "@mui/material/TextField";
import { DatePicker } from "@mui/x-date-pickers";
import { useTranslation } from "i18n";
import { Control, Controller, UseControllerOptions } from "react-hook-form";
import dayjs, { Dayjs } from "utils/dayjs";

import { dateFormats } from "./constants";

const getLocaleFormat = () => {
  return navigator.language in dateFormats
    ? dateFormats[navigator.language as keyof typeof dateFormats]
    : "DD/MM/YYYY";
};

interface DatepickerProps {
  className?: string;
  control: Control;
  defaultValue?: Dayjs | null;
  error: boolean;
  helperText: React.ReactNode;
  id: string;
  rules?: UseControllerOptions["rules"];
  label?: string;
  name: string;
  minDate?: Dayjs;
  onPostChange?(date: Dayjs): void;
  openTo?: "year" | "month" | "day";
  testId?: string;
}

export default function Datepicker({
  className,
  control,
  defaultValue,
  error,
  helperText,
  id,
  rules,
  label,
  minDate = dayjs(),
  name,
  onPostChange,
  openTo = "day",
  testId,
}: DatepickerProps) {
  const { t } = useTranslation();
  return (
    <Controller
      control={control}
      defaultValue={defaultValue}
      name={name}
      rules={rules}
      render={({ value, onChange }) => (
        <DatePicker
          className={className}
          data-testid={testId}
          label={label}
          value={value}
          minDate={minDate}
          onChange={(date) => {
            if (date?.isValid()) {
              onChange(date);
              onPostChange?.(date);
            }
          }}
          openTo={openTo}
          views={["year", "month", "day"]}
          inputFormat={getLocaleFormat()}
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
