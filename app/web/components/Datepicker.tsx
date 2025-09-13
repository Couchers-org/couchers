import { InputProps } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import {
  Control,
  Controller,
  FieldValues,
  Path,
  RegisterOptions,
} from "react-hook-form";

import { useTranslation } from "@/i18n";
import dayjs, { Dayjs } from "@/utils/dayjs";
import { KeysWithType } from "@/utils/types";

import { dateFormats } from "./constants";

const getLocaleFormat = () => {
  return navigator.language in dateFormats
    ? dateFormats[navigator.language as keyof typeof dateFormats]
    : "DD/MM/YYYY";
};

type DayjsPath<T> = Extract<KeysWithType<T, Dayjs | undefined>, Path<T>>;

interface DatepickerProps<
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
  minDate?: Dayjs;
  maxDate?: Dayjs;
  openTo?: "year" | "month" | "day";
  onPostChange?: (date: TFieldValues[TName]) => void;
  testId?: string;
  variant?: "standard" | "outlined" | "filled";
  inputProps?: InputProps;
}

const Datepicker = <
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
  minDate = dayjs(),
  maxDate,
  name,
  openTo = "day",
  onPostChange,
  testId,
  variant = "standard",
  inputProps = {},
}: DatepickerProps<TFieldValues, TName>) => {
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
          onChange={(date: Dayjs | null) => {
            field.onChange(date);
            if (date) {
              onPostChange?.(date as TFieldValues[TName]);
            }
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
              /* eslint-disable @typescript-eslint/naming-convention */
              InputLabelProps: { shrink: true },
              InputProps: {
                ...inputProps,
                className,
                "aria-label": t("components.datepicker.change_date"),
              },
              /* eslint-enable @typescript-eslint/naming-convention */
            },
          }}
        />
      )}
    />
  );
};

export default Datepicker;
