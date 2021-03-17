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
  helperText: any;
  id: string;
  inputRef: (ref: any) => void;
  label: string;
  name: string;
}

export default function Datepicker({
  className,
  control,
  error,
  helperText,
  id,
  inputRef,
  label,
  name,
}: DatepickerProps) {
  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <Controller
        control={control}
        defaultValue={new Date().toISOString().split("T")[0]}
        inputRef={inputRef}
        name={name}
        render={({ onChange, value }) => (
          <KeyboardDatePicker
            animateYearScrolling={true}
            autoOk
            className={className}
            clearable
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
            minDate={new Date(1899, 12, 1)}
            onChange={(date) => {
              //user might be typing, so check the date is valid before doing conversions
              date?.isValid() 
                ? onChange(date?.format().split("T")[0])
                : onChange(date);
            }}
            value={value}
            variant="inline"
          />
        )}
      />
    </MuiPickersUtilsProvider>
  );
}
