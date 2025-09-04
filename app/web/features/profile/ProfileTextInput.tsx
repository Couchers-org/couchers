import { TextFieldProps } from "@mui/material";
import React, { LegacyRef, RefObject, forwardRef } from "react";

import TextField from "@/components/TextField";

interface ProfileTextInputProps extends Omit<TextFieldProps, "margin"> {
  id: NonNullable<TextFieldProps["id"]>;
}

const ProfileTextInput = forwardRef(
  (
    props: ProfileTextInputProps,
    ref: RefObject<HTMLInputElement> | LegacyRef<HTMLDivElement> | undefined,
  ) => {
    return <TextField ref={ref} {...props} margin="normal" />;
  },
);

ProfileTextInput.displayName = "ProfileTextInput";

export default ProfileTextInput;
