import { InputProps } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { useTranslation } from "i18n";
import { useState } from "react";
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
  const [open, setOpen] = useState(false);
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
            ? {
                // Use the legacy single input so there is no editable section
                // mask, and drive opening ourselves so clicking the field works.
                enableAccessibleFieldDOMStructure: false as const,
                open,
                onOpen: () => setOpen(true),
                onClose: () => setOpen(false),
              }
            : {})}
          slotProps={{
            textField: {
              // Apply the consumer className to the field root (FormControl) so
              // layout styles like margins wrap the whole field, not the input
              // box (which would push the helper text away from the input).
              className,
              fullWidth: true,
              id,
              error,
              helperText: (
                <span data-testid={`${name}-helper-text`}>{helperText}</span>
              ),
              variant,
              slotProps: {
                inputLabel: { shrink: true },
                ...(pickerInputOnly ? { htmlInput: { readOnly: true } } : {}),
              },
              ...(pickerInputOnly
                ? {
                    onClick: () => setOpen(true),
                    placeholder: "",
                  }
                : {}),
              InputProps: {
                ...(inputProps || {}),
                "aria-label": t("components.datepicker.change_date"),
              },
            },
          }}
        />
      )}
    />
  );
};

export default Datepicker;
