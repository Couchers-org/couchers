import DateFnsUtils from "@date-io/dayjs";
import {
  KeyboardDatePicker,
  MuiPickersUtilsProvider,
} from "@material-ui/pickers";
import { CHANGE_DATE } from "features/constants";
import { Control, Controller } from "react-hook-form";

import { dateFormats } from "./constants";

const getLocaleFormat = () => {
  let locale =
    navigator.language in dateFormats
      ? dateFormats[navigator.language as keyof typeof dateFormats]
      : "DD/MM/YYYY";
  //convoluted way to convert and single letter date formats to double letter
  //eg. "M/D/YYYY" to "MM/DD/YYYY"
  //this is because keyboard typing is a total disaster for single letter formats
  locale = locale
    .replace("DD", "D")
    .replace("MM", "M")
    .replace("D", "DD")
    .replace("M", "MM");
  return locale;
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
}: DatepickerProps) {
  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <Controller
        control={control}
        defaultValue={minDate}
        inputRef={inputRef}
        name={name}
        render={({ onChange, value }) => (
          <KeyboardDatePicker
            animateYearScrolling={true}
            autoOk
            className={className}
            disableToolbar
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
              if (date?.isValid()) onChange(date?.toDate());
            }}
            value={value}
            variant="inline"
          />
        )}
      />
    </MuiPickersUtilsProvider>
  );
}
