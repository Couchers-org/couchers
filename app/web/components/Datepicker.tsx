import DateFnsUtils from "@date-io/dayjs";
import {
  DatePickerView,
  KeyboardDatePicker,
  MuiPickersUtilsProvider,
} from "@material-ui/pickers";
import { useTranslation } from "i18n";
import { Control, Controller, UseControllerOptions } from "react-hook-form";
import { Dayjs } from "utils/dayjs";

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
  minDate?: Date;
  openTo?: DatePickerView;
  onPostChange?(date: Dayjs): void;
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
  minDate = new Date(),
  name,
  openTo = "date",
  onPostChange,
  testId,
}: DatepickerProps) {
  const { t } = useTranslation();
  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <Controller
        control={control}
        defaultValue={defaultValue}
        name={name}
        rules={rules}
        render={({ onChange, value }) => (
          <KeyboardDatePicker
            animateYearScrolling={true}
            autoOk
            className={className}
            data-testid={testId}
            error={error}
            format={getLocaleFormat()}
            fullWidth
            helperText={helperText}
            id={id}
            KeyboardButtonProps={{
              "aria-label": t("components.datepicker.change_date"),
            }}
            InputLabelProps={{
              shrink: true,
            }}
            label={label}
            minDate={minDate}
            onChange={(date) => {
              if (date?.isValid()) {
                onChange(date);
                onPostChange?.(date);
              }
            }}
            openTo={openTo}
            views={["year", "month", "date"]}
            value={value}
            variant="inline"
          />
        )}
      />
    </MuiPickersUtilsProvider>
  );
}
