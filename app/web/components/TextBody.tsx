import { Typography, TypographyProps } from "@material-ui/core";
import React from "react";

export default function TextBody(props: TypographyProps) {
  return <Typography {...props} variant="body1" />;
}
