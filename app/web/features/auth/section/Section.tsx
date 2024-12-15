import { Typography } from "@mui/material";
import React, { ReactNode } from "react";

type SectionProps = {
  title: string;
  content: ReactNode;
  className?: string;
};

export default function Section({ title, content, className }: SectionProps) {
  return (
    <div className={className}>
      <Typography variant="h2">{title}</Typography>
      <Typography variant="body1">{content}</Typography>
    </div>
  );
}
