import { TextFieldProps } from "@material-ui/core";
import React from "react";
import TextField from "../../components/TextField";

type ProfileTextInputProps = Omit<
  TextFieldProps,
  "fullWidth" | "margin" | "variant"
>;

export default function ProfileTextInput(props: ProfileTextInputProps) {
  return <TextField {...props} variant="outlined" margin="normal" fullWidth />;
}
