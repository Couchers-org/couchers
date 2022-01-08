import { TextFieldProps } from "@material-ui/core";
import TextField from "components/TextField";
import React from "react";

interface ProfileTextInputProps extends Omit<TextFieldProps, "margin"> {
  id: NonNullable<TextFieldProps["id"]>;
}

export default function ProfileTextInput(props: ProfileTextInputProps) {
  return <TextField {...props} margin="normal" />;
}
