import DateFnsUtils from "@date-io/dayjs";
import { KeyboardDatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import { Control, Controller } from "react-hook-form";

interface DateFieldProps {
  control: Control;
  name: string;
  inputRef: (ref: any) => void;
  className: string;
  id: string;
  error: boolean;
  label: string;
  helperText: any
}

export default function DateField({
  control,
  name,
  inputRef,
  className,
  id,
  error,
  label,
  helperText
}: DateFieldProps) {
  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <Controller
        control={control}
        defaultValue={new Date().toISOString().split("T")[0]}
        name={name}
        inputRef={inputRef}
        
        render={({ onChange, value }) => (
          <KeyboardDatePicker
            className={className}
            error={error}
            helperText={helperText}
            id={id}
            clearable
            format="DD.MM.YYYY"
            label={label}
            onChange={(date) => {
              //user might be typing, so check the date is valid before doing conversions
              date?.isValid()
                ? onChange(date?.format().split("T")[0])
                : onChange(date);
            }} 
            value={value}
            animateYearScrolling={true}
            fullWidth
            disableToolbar
            autoOk
            variant="inline"
            InputLabelProps={{
              shrink: true,
            }}
          />
        )}
      />
    </MuiPickersUtilsProvider>
  );
}