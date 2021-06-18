import DateFnsUtils from "@date-io/dayjs";
import {
  DatePickerView,
  KeyboardDatePicker,
  MuiPickersUtilsProvider,
} from "@material-ui/pickers";
import dayjs from "dayjs";
import { CHANGE_DATE } from "features/constants";
import { Control, Controller } from "react-hook-form";

import { dateFormats } from "./constants";

const getLocaleFormat = () => {
  return navigator.language in dateFormats
    ? dateFormats[navigator.language as keyof typeof dateFormats]
    : "DD/MM/YYYY";
};

interface DatepickerProps {
  className?: string;
  control: Control;
  error: boolean;
  helperText: React.ReactNode;
  id: string;
  inputRef: (ref: any) => void;
  label: string;
  name: string;
  minDate?: Date;
  openTo?: DatePickerView;
}

export default function Datepicker({
  className,
  control,
  error,
  helperText,
  id,
  inputRef,
  label,
  minDate = new Date(),
  name,
  openTo = "date",
}: DatepickerProps) {
  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <Controller
        control={control}
        defaultValue={dayjs()}
        inputRef={inputRef}
        name={name}
        render={({ onChange, value }) => (
          <KeyboardDatePicker
            animateYearScrolling={true}
            autoOk
            className={className}
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
              if (date?.isValid()) onChange(date);
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
