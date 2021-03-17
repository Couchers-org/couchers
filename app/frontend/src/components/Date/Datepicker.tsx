import DateFnsUtils from "@date-io/date-fns";
import {
  KeyboardDatePicker,
  MuiPickersUtilsProvider,
} from "@material-ui/pickers";
import React from "react";

interface DatepickerProps {
  className?: string;
  name: string;
  label: string;
  minDate: Date;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

export default function Datepicker({
  className,
  name,
  label,
  minDate,
  selectedDate,
  setSelectedDate,
}: DatepickerProps) {
  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <KeyboardDatePicker
        name={name}
        className={className}
        disableToolbar
        variant="inline"
        format="MM/dd/yyyy"
        label={label}
        minDate={minDate}
        value={selectedDate}
        onChange={(value) => value && setSelectedDate(value)}
        KeyboardButtonProps={{
          "aria-label": "change date",
        }}
      />
    </MuiPickersUtilsProvider>
  );
}
