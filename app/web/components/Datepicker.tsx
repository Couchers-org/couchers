import { InputProps, TextField } from "@mui/material";
import {
  DatePicker,
  DatePickerProps,
  usePickerAdapter,
  usePickerContext,
} from "@mui/x-date-pickers";
import { useTranslation } from "i18n";
import { getMuiDateFormat } from "i18n/datetimes";
import { Control, Controller, UseControllerProps } from "react-hook-form";
import { Temporal } from "temporal-polyfill";
import dayjs, { Dayjs } from "utils/dayjs";

interface DatepickerProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  defaultValue?: Temporal.PlainDate;
  error: boolean;
  helperText: React.ReactNode;
  id: string;
  rules?: UseControllerProps["rules"];
  label?: string;
  name: string;
  minValue?: Temporal.PlainDate;
  maxValue?: Temporal.PlainDate;
  openTo?: "year" | "month" | "day";
  onPostChange?(value: Temporal.PlainDate | null): void;
  testId?: string;
}

type BaseDatepickerProps = Omit<
  DatepickerProps,
  "error" | "helperText" | "id"
> &
  Pick<DatePickerProps, "slots" | "slotProps"> & {
    format: string;
  };

// Convert between our API's Temporal.PlainDate and MUI's expected Dayjs values.
// Use the browser timezone in case we compare to now, aka dayjs().
function temporalToDayjs(value: Temporal.PlainDate): Dayjs {
  return dayjs(value.toString(), "YYYY-MM-DD");
}

function dayjsToTemporal(value: Dayjs): Temporal.PlainDate {
  return Temporal.PlainDate.from(value.format("YYYY-MM-DD"));
}

const BaseDatepicker = ({
  className,
  control,
  defaultValue,
  rules,
  label,
  minValue = dayjsToTemporal(dayjs()),
  maxValue,
  name,
  openTo = "day",
  onPostChange,
  testId,
  format,
  slots,
  slotProps,
}: BaseDatepickerProps) => {
  return (
    <Controller
      control={control}
      defaultValue={defaultValue ?? null}
      name={name}
      rules={rules}
      render={({ field }) => (
        <DatePicker
          data-testid={testId}
          {...field}
          className={className}
          label={label}
          value={field.value ? temporalToDayjs(field.value) : null}
          minDate={minValue ? temporalToDayjs(minValue) : undefined}
          maxDate={maxValue ? temporalToDayjs(maxValue) : undefined}
          onChange={(valueDayjs: Dayjs | null) => {
            const valueTemporal =
              valueDayjs && valueDayjs.isValid()
                ? dayjsToTemporal(valueDayjs)
                : null;
            field.onChange(valueTemporal);
            onPostChange?.(valueTemporal);
          }}
          openTo={openTo}
          views={["year", "month", "day"]}
          format={format}
          slots={slots}
          slotProps={slotProps}
        />
      )}
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
  minValue,
  maxValue,
  name,
  openTo,
  onPostChange,
  testId,
}: DatepickerProps) => {
  const { t, i18n } = useTranslation();
  const ariaLabel = t("components.datepicker.change_date");
  const helperNode = (
    <span data-testid={`${name}-helper-text`}>{helperText}</span>
  );

  return (
    <BaseDatepicker
      className={className}
      control={control}
      defaultValue={defaultValue}
      rules={rules}
      label={label}
      minValue={minValue}
      maxValue={maxValue}
      name={name}
      openTo={openTo}
      onPostChange={onPostChange}
      testId={testId}
      format={getMuiDateFormat(i18n.language)}
      slotProps={{
        textField: {
          fullWidth: true,
          id,
          error,
          helperText: helperNode,
          variant: "standard",
          slotProps: {
            inputLabel: { shrink: true },
            input: { "aria-label": ariaLabel },
          },
        },
        // Shrink the calendar button so its circular hover/ripple stays within
        // the input's content box instead of overlapping the (standard variant)
        // underline.
        openPickerButton: {
          size: "small",
        },
      }}
    />
  );
};

interface ReadOnlyDateFieldProps {
  id?: string;
  error?: boolean;
  helperText?: React.ReactNode;
  variant?: "standard" | "outlined" | "filled";
  ariaLabel: string;
  inputProps?: InputProps;
}

// Read-only field used by PickerOnlyDatepicker. It renders the selected date as
// a localized long date (month name) and is blank when no date is set, so there
// is never an editable section mask or format placeholder. Clicking it opens the
// calendar, which is the only way to set the value.
const ReadOnlyDateField = ({
  id,
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
      className={pickerContext.rootClassName}
      id={id}
      label={pickerContext.label}
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

interface PickerOnlyDatepickerProps extends DatepickerProps {
  variant?: "standard" | "outlined" | "filled";
  inputProps?: InputProps;
}

// A date field that can only be set through the picker: no text input, no mask
// placeholder, clicking anywhere (not just the icon) opens the calendar, and the
// chosen date is shown as a localized long date with the month name
// (e.g. "May 25, 1990"). Contrast with the default editable Datepicker, whose
// field is an editable, parseable numeric date in the locale's format.
export const PickerOnlyDatepicker = ({
  className,
  control,
  defaultValue,
  error,
  helperText,
  id,
  rules,
  label,
  minValue,
  maxValue,
  name,
  openTo,
  onPostChange,
  testId,
  variant = "standard",
  inputProps = {},
}: PickerOnlyDatepickerProps) => {
  const { t } = useTranslation();
  const ariaLabel = t("components.datepicker.change_date");
  const helperNode = (
    <span data-testid={`${name}-helper-text`}>{helperText}</span>
  );

  const readOnlyFieldProps: ReadOnlyDateFieldProps = {
    id,
    error,
    helperText: helperNode,
    variant,
    ariaLabel,
    inputProps,
  };

  return (
    <BaseDatepicker
      className={className}
      control={control}
      defaultValue={defaultValue}
      rules={rules}
      label={label}
      minValue={minValue}
      maxValue={maxValue}
      name={name}
      openTo={openTo}
      onPostChange={onPostChange}
      testId={testId}
      // "LL" is the localized long date with the month name (e.g. "May 25, 1990")
      format="LL"
      slots={{ field: ReadOnlyDateField }}
      slotProps={{ field: readOnlyFieldProps }}
    />
  );
};

export default Datepicker;
