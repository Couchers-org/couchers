import DateFnsUtils from "@date-io/dayjs";
import {
  KeyboardTimePicker,
  MuiPickersUtilsProvider,
} from "@material-ui/pickers";
import { CHANGE_TIME } from "features/constants";
import { Control, Controller } from "react-hook-form";
import dayjs, { Dayjs } from "utils/dayjs";

interface TimepickerProps {
  control: Control;
  defaultValue?: Dayjs;
  id: string;
  label: string;
  name: string;
  className?: string;
  error?: boolean;
  errorText?: string;
}

export default function Timepicker({
  className,
  control,
  defaultValue,
  error,
  errorText,
  id,
  label,
  name,
}: TimepickerProps) {
  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <Controller
        control={control}
        defaultValue={defaultValue ?? dayjs()}
        name={name}
        render={({ onChange, value }) => (
          <KeyboardTimePicker
            autoOk
            className={className}
            error={error}
            fullWidth
            helperText={errorText}
            id={id}
            KeyboardButtonProps={{
              "aria-label": CHANGE_TIME,
            }}
            label={label}
            onChange={(date) => {
              if (date?.isValid()) {
                onChange(date);
              }
            }}
            value={value}
            variant="inline"
          />
        )}
      />
    </MuiPickersUtilsProvider>
  );
}
