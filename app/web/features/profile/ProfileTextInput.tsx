import { TextFieldProps } from "@mui/material";
import TextField from "components/TextField";
import React, { forwardRef, Ref, RefObject } from "react";

interface ProfileTextInputProps extends Omit<TextFieldProps, "margin"> {
  id: NonNullable<TextFieldProps["id"]>;
}

const ProfileTextInput = forwardRef(
  (props: ProfileTextInputProps, ref: RefObject<HTMLInputElement | null> | Ref<HTMLDivElement> | undefined) => {
    return <TextField ref={ref} {...props} margin="normal" />;
  },
);

ProfileTextInput.displayName = "ProfileTextInput";

export default ProfileTextInput;
