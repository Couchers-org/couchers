import { TimePicker } from "@mui/x-date-pickers";
import { useTranslation } from "i18n";
import { getMuiTimeFormat } from "i18n/dates";
import { GLOBAL } from "i18n/namespaces";
import React, { useMemo } from "react";
import { Control, Controller, UseControllerProps } from "react-hook-form";
import { Dayjs } from "utils/dayjs";

interface TimepickerProps {
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
  onPostChange?(time: Dayjs | null): void;
  testId?: string;
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
      defaultValue={defaultValue}
      name={name}
      rules={rules}
      render={({ field }) => (
        <TimePicker
          data-testid={testId}
          {...field}
          label={label}
          value={field.value}
          onChange={(time: Dayjs | null) => {
            field.onChange(time);
            onPostChange?.(time);
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
