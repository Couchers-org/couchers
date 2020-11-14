import { TextFieldProps } from "@material-ui/core";
import React from "react";
import TextInput from "../../components/TextField";

interface ProfileTextInputProps
  extends Pick<
    TextFieldProps,
    "label" | "name" | "defaultValue" | "inputRef" | "multiline" | "rowsMax"
  > {}

export default function ProfileTextInput(props: ProfileTextInputProps) {
  return <TextInput {...props} variant="outlined" margin="normal" fullWidth />;
}
