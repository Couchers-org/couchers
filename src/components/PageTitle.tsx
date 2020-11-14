import { Typography, TypographyProps } from "@material-ui/core";
import React from "react";

export default function PageTitle(props: TypographyProps) {
  return <Typography {...props} variant={"h1"} />;
}
