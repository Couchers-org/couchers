import { Typography, TypographyProps } from "@material-ui/core";
import React from "react";

export default function H3(props: TypographyProps) {
  return <Typography {...props} variant={"h3"} />;
}
