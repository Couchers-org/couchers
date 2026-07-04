import { Temporal } from "@js-temporal/polyfill";
import { TimePicker } from "@mui/x-date-pickers";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import React, { useMemo } from "react";
import { Control, Controller, UseControllerProps } from "react-hook-form";
import { getMuiTimeFormat } from "utils/date";
import dayjs, { Dayjs } from "utils/dayjs";

interface TimepickerProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  defaultValue?: Temporal.PlainTime;
  error: boolean;
  helperText: React.ReactNode;
  id: string;
  rules?: UseControllerProps["rules"];
  label?: string;
  name: string;
  onPostChange?(value: Temporal.PlainTime | null): void;
  testId?: string;
}

// Convert between our API's Temporal.PlainTime and MUI's expected Dayjs values.
// Use the browser timezone in case we compare to now, aka dayjs().
function temporalToDayjs(value: Temporal.PlainTime): Dayjs {
  const timeString = value.toString({ smallestUnit: "minute" });
  return dayjs(`1970-01-01T${timeString}`); // We don't care about the date, but dayjs needs one.
}

function dayjsToTemporal(value: Dayjs): Temporal.PlainTime {
  return Temporal.PlainTime.from(value.format("HH:mm"));
}

const Timepicker = ({
  className,
  control,
  defaultValue,
  error,
  helperText,
  id,
  rules,
  label,
  name,
  onPostChange,
  testId,
}: TimepickerProps) => {
  const { t, i18n } = useTranslation([GLOBAL]);
  const format = useMemo(
    () => getMuiTimeFormat(i18n.language),
    [i18n.language],
  );

  return (
    <Controller
      control={control}
      defaultValue={defaultValue ?? null}
      name={name}
      rules={rules}
      render={({ field }) => (
        <TimePicker
          data-testid={testId}
          {...field}
          label={label}
          value={field.value ? temporalToDayjs(field.value) : undefined}
          onChange={(valueDayjs: Dayjs | null) => {
            const valueTemporal =
              valueDayjs && valueDayjs.isValid()
                ? dayjsToTemporal(valueDayjs)
                : null;
            field.onChange(valueTemporal);
            onPostChange?.(valueTemporal);
          }}
          format={format}
          ampm={format.includes("a")} // Clock picker uses am/pm iff format also uses it
          slotProps={{
            textField: {
              fullWidth: true,
              id,
              error,
              helperText: (
                <span data-testid={`${name}-helper-text`}>{helperText}</span>
              ),
              variant: "standard",
              InputProps: {
                className,
                "aria-label": t("global:change_time"),
              },
              slotProps: { inputLabel: { shrink: true } },
              sx: {
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "var(--mui-palette-primary-main)",
                  color: "var(--mui-palette-text-primary)",
                },
                "& .MuiPaper-root": {
                  backgroundColor: "var(--mui-palette-primary-main)",
                  color: "var(--mui-palette-text-primary)",
                },
              },
            },
          }}
        />
      )}
    />
  );
};

export default Timepicker;
