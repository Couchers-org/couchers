import { Typography } from "@mui/material";
import React, { ReactNode } from "react";
import { Control } from "react-hook-form";

import Alert from "@/components/Alert";
import MarkdownInput from "@/components/MarkdownInput";

interface ProfileMarkdownInputProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  defaultValue?: string;
  id: string;
  label: string;
  name: string;
  warning?: boolean;
  helperText?: string | ReactNode;
  description?: ReactNode;
  placeholder?: string;
}

export default function ProfileMarkdownInput({
  className,
  control,
  defaultValue = "",
  id,
  label,
  name,
  warning,
  description,
  helperText,
  placeholder,
}: ProfileMarkdownInputProps) {
  return (
    <div className={className}>
      <Typography variant="h2" id={`${id}-label`}>
        {label}
      </Typography>
      {warning && helperText && (
        <Alert severity="warning" data-testid={`${id}-input-helper-text`}>
          {helperText}
        </Alert>
      )}
      {description}
      <MarkdownInput
        control={control}
        defaultValue={defaultValue}
        id={id}
        labelId={`${id}-label`}
        name={name}
        placeholder={placeholder}
      />
    </div>
  );
}
