import DateFnsUtils from "@date-io/dayjs";
import {
  KeyboardDatePicker,
  MuiPickersUtilsProvider,
} from "@material-ui/pickers";
import { Control, Controller } from "react-hook-form";

interface DatepickerProps {
  className?: string;
  control: Control;
  error: boolean;
  helperText: string | undefined;
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
            format="DD.MM.YYYY"
            fullWidth
            helperText={helperText}
            id={id}
            InputLabelProps={{
              shrink: true,
            }}
            label={label}
            minDate={minDate}
            onChange={(date) => onChange(date?.toDate())}
            value={value}
            variant="inline"
          />
        )}
      />
    </MuiPickersUtilsProvider>
  );
}
