import { Typography } from "@mui/material";
import MarkdownInput from "components/MarkdownInput";
import React from "react";
import { Control } from "react-hook-form";
import { theme } from "theme";

interface ProfileMarkdownInputProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  defaultValue?: string;
  id: string;
  label: string;
  name: string;
  error?: boolean;
  helperText?: string | undefined;
}

export default function ProfileMarkdownInput({
  className,
  control,
  defaultValue = "",
  id,
  label,
  name,
  error,
  helperText,
}: ProfileMarkdownInputProps) {
  return (
    <div className={className}>
      <Typography variant="h2" id={`${id}-label`}>
        {label}
      </Typography>
      {error && (
        <Typography
          variant="subtitle1"
          sx={{ color: theme.palette.error.main, fontSize: "0.75rem" }}
        >
          {helperText}
        </Typography>
      )}
      <MarkdownInput
        control={control}
        defaultValue={defaultValue}
        id={id}
        labelId={`${id}-label`}
        name={name}
      />
    </div>
  );
}
