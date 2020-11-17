import { TextFieldProps } from "@material-ui/core";
import React from "react";
import TextField from "../../components/TextField";

interface ProfileTextInputProps
  extends Pick<
    TextFieldProps,
    "label" | "name" | "defaultValue" | "inputRef" | "multiline" | "rowsMax"
  > {}

export default function ProfileTextInput(props: ProfileTextInputProps) {
  return <TextField {...props} variant="outlined" margin="normal" fullWidth />;
}
