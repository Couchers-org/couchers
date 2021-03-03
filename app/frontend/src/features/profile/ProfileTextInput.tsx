import { TextFieldProps } from "@material-ui/core";
import TextField from "components/TextField";
import React from "react";

type ProfileTextInputProps = Omit<TextFieldProps, "margin">;

export default function ProfileTextInput(props: ProfileTextInputProps) {
  return <TextField {...props} margin="normal" id="profile-text-input" />;
}
