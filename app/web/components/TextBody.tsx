import { Typography, TypographyProps } from "@mui/material";
import React from "react";

export default function TextBody(props: TypographyProps) {
  return <Typography {...props} variant="body1" />;
}
