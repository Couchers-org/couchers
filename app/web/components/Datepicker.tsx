import { InputProps, TextField } from "@mui/material";
import {
  DatePicker,
  DatePickerProps,
  usePickerAdapter,
  usePickerContext,
} from "@mui/x-date-pickers";
import { useTranslation } from "i18n";
import { Control, Controller, UseControllerProps } from "react-hook-form";
import { getMuiDateFormat } from "utils/date";
import dayjs, { Dayjs } from "utils/dayjs";

interface DatepickerProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  defaultValue?: Dayjs | null;
  error: boolean;
  helperText: React.ReactNode;
  id: string;
  rules?: UseControllerProps["rules"];
  label?: string;
  name: string;
  minDate?: Dayjs;
  maxDate?: Dayjs;
  openTo?: "year" | "month" | "day";
  onPostChange?(date: Dayjs | null): void;
  testId?: string;
  variant?: "standard" | "outlined" | "filled";
  inputProps?: InputProps;
  // When true the field can only be set through the picker: no text input, no
  // mask placeholder, clicking anywhere (not just the icon) opens the calendar,
  // and the chosen date is shown as a localized long date with the month name
  // (e.g. "May 25, 1990"). Otherwise the field is an editable, parseable numeric
  // date in the locale's format.
  pickerInputOnly?: boolean;
}

interface ReadOnlyDateFieldProps {
  className?: string;
  id?: string;
  label?: React.ReactNode;
  error?: boolean;
  helperText?: React.ReactNode;
  variant?: "standard" | "outlined" | "filled";
  ariaLabel: string;
  inputProps?: InputProps;
}

// Read-only field used by `pickerInputOnly` pickers. It renders the selected
// date as a localized long date (month name) and is blank when no date is set,
// so there is never an editable section mask or format placeholder. Clicking it
// opens the calendar, which is the only way to set the value.
const ReadOnlyDateField = ({
  className,
  id,
  label,
  error,
  helperText,
  variant,
  ariaLabel,
  inputProps,
}: ReadOnlyDateFieldProps) => {
  const pickerContext = usePickerContext<Dayjs | null>();
  const adapter = usePickerAdapter();
  const value = pickerContext.value;
  // Format through the picker adapter so the long date respects the picker's
  // adapterLocale (e.g. German "8. April 1990"), not just dayjs's global locale.
  const display = value ? adapter.formatByString(value, "LL") : "";

  return (
    <TextField
      ref={pickerContext.triggerRef}
      className={className}
      id={id}
      label={label}
      error={error}
      helperText={helperText}
      variant={variant}
      fullWidth
      value={display}
      onClick={() => pickerContext.setOpen(true)}
      slotProps={{
        inputLabel: { shrink: true },
        htmlInput: { readOnly: true, "aria-label": ariaLabel },
        input: inputProps,
      }}
    />
  );
};

const Datepicker = ({
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
  pickerInputOnly = false,
}: DatepickerProps) => {
  const { t, i18n } = useTranslation();
  const ariaLabel = t("components.datepicker.change_date");
  const helperNode = (
    <span data-testid={`${name}-helper-text`}>{helperText}</span>
  );

  // `pickerInputOnly` swaps the editable masked field for a read-only field slot
  // (ReadOnlyDateField) so there is never a format placeholder. ReadOnlyDateField
  // deliberately doesn't conform to MUI's injected field props (it reads value
  // and open-state from the picker context), so the slot wiring is cast through
  // `unknown` — MUI's own custom-field pattern requires this.
  const pickerOnlyProps = {
    slots: { field: ReadOnlyDateField },
    slotProps: {
      field: {
        className,
        id,
        label,
        error,
        helperText: helperNode,
        variant,
        ariaLabel,
        inputProps,
      },
    },
  } as unknown as Partial<DatePickerProps>;

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
          onChange={(date) => {
            field.onChange(date);
            onPostChange?.(date);
          }}
          openTo={openTo}
          views={["year", "month", "day"]}
          // Picker-only fields show a localized long date with the month name;
          // editable fields use the parseable numeric locale format.
          format={pickerInputOnly ? "LL" : getMuiDateFormat(i18n.language)}
          {...(pickerInputOnly
            ? pickerOnlyProps
            : {
                slotProps: {
                  textField: {
                    // Apply the consumer className to the field root (FormControl)
                    // so layout styles like margins wrap the whole field, not the
                    // input box (which would push the helper text away).
                    className,
                    fullWidth: true,
                    id,
                    error,
                    helperText: helperNode,
                    variant,
                    slotProps: {
                      inputLabel: { shrink: true },
                    },
                    InputProps: {
                      ...(inputProps || {}),
                      "aria-label": ariaLabel,
                    },
                  },
                },
              })}
        />
      )}
    />
  );
};

export default Datepicker;
