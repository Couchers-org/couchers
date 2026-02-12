import { InputProps } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { useTranslation } from "i18n";
import { Control, Controller, UseControllerProps } from "react-hook-form";
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
  variant?: "standard" | "outlined" | "filled";
  inputProps?: InputProps;
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
  variant = "standard",
  inputProps = {},
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
          format={getLocaleFormat()}
          slotProps={{
            textField: {
              fullWidth: true,
              id,
              error,
              helperText: (
                <span data-testid={`${name}-helper-text`}>{helperText}</span>
              ),
              variant,
              slotProps: { inputLabel: { shrink: true } },
              InputProps: {
                ...(inputProps || {}),
                className,
                "aria-label": t("components.datepicker.change_date"),
              },
            },
          }}
        />
      )}
    />
  );
};

export default Datepicker;
