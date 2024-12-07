import { TextFieldProps } from "@mui/material";
import TextField from "components/TextField";
import React from "react";

interface ProfileTextInputProps extends Omit<TextFieldProps, "margin"> {
  id: NonNullable<TextFieldProps["id"]>;
}

export default function ProfileTextInput(props: ProfileTextInputProps) {
  const { ref, ...restProps } = props;
  return <TextField inputRef={ref} {...restProps} margin="normal" />;
}
