import { TimePicker } from "@mui/x-date-pickers";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import React, { useMemo } from "react";
import { Control, Controller, UseControllerProps } from "react-hook-form";
import {
  getMuiTimeFormat,
  ISO8601_DATE_FORMAT,
  ISO8601_HOUR_MIN_FORMAT,
} from "utils/date";
import dayjs, { Dayjs } from "utils/dayjs";

interface TimepickerProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  defaultValueISO8601?: string;
  error: boolean;
  helperText: React.ReactNode;
  id: string;
  rules?: UseControllerProps["rules"];
  label?: string;
  name: string;
  onPostChange?(timeISO8601: string | null): void;
  testId?: string;
}

// Convert between our API's ISO8601 strings and MUI's expected Dayjs values.
function iso8601ToDayjs(value: string): Dayjs {
  return dayjs(
    `1970-01-01T${value}`,
    `${ISO8601_DATE_FORMAT}T${ISO8601_HOUR_MIN_FORMAT}`,
  );
}

function dayjsToISO8601(value: Dayjs): string {
  return value.format(ISO8601_HOUR_MIN_FORMAT);
}

const Timepicker = ({
  className,
  control,
  defaultValueISO8601,
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
      defaultValue={defaultValueISO8601 ?? null}
      name={name}
      rules={rules}
      render={({ field }) => (
        <TimePicker
          data-testid={testId}
          {...field}
          label={label}
          value={field.value ? iso8601ToDayjs(field.value) : undefined}
          onChange={(value: Dayjs | null) => {
            const valueISO8601 = value ? dayjsToISO8601(value) : null;
            field.onChange(valueISO8601);
            onPostChange?.(valueISO8601);
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
