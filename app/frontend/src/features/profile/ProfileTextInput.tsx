import { TextFieldProps } from "@material-ui/core";
import React from "react";

import TextField from "../../components/TextField";

type ProfileTextInputProps = Omit<TextFieldProps, "margin">;

export default function ProfileTextInput(props: ProfileTextInputProps) {
  return <TextField {...props} margin="normal" id="profile-text-input" />;
}
