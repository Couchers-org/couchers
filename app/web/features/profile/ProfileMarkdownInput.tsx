import { Typography } from "@mui/material";
import Alert from "components/Alert";
import MarkdownInput from "components/MarkdownInput";
import React from "react";
import { Control } from "react-hook-form";

interface ProfileMarkdownInputProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  defaultValue?: string;
  id: string;
  label: string;
  name: string;
  warning?: boolean;
  helperText?: string;
}

export default function ProfileMarkdownInput({
  className,
  control,
  defaultValue = "",
  id,
  label,
  name,
  warning,
  helperText,
}: ProfileMarkdownInputProps) {
  return (
    <div className={className}>
      <Typography variant="h2" id={`${id}-label`}>
        {label}
      </Typography>
      {warning && helperText && <Alert severity="warning">{helperText}</Alert>}
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
