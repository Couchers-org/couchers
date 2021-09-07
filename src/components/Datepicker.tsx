import DateFnsUtils from "@date-io/dayjs";
import {
  DatePickerView,
  KeyboardDatePicker,
  MuiPickersUtilsProvider,
} from "@material-ui/pickers";
import { CHANGE_DATE } from "features/constants";
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
  defaultValue?: Dayjs;
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
  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <Controller
        control={control}
        defaultValue={defaultValue ?? dayjs()}
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
              "aria-label": CHANGE_DATE,
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
