import { Divider as MuiDivider } from "@mui/material";
import React from "react";
import { theme } from "theme";

export interface DividerProps {
  className?: string;
  spacing?: number;
}

export default function Divider({ className, spacing = 2 }: DividerProps) {
  return (
    <MuiDivider
      className={className}
      sx={{
        marginBottom: theme.spacing(spacing),
        marginTop: theme.spacing(spacing),
      }}
    />
  );
}
