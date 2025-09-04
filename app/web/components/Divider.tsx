import { Divider as MuiDivider, SxProps } from "@mui/material";
import React from "react";

import { theme } from "@/theme";

export interface DividerProps {
  className?: string;
  spacing?: number;
  sx?: SxProps;
}

export default function Divider({ className, spacing = 2, sx }: DividerProps) {
  return (
    <MuiDivider
      className={className}
      sx={{
        marginBottom: theme.spacing(spacing),
        marginTop: theme.spacing(spacing),
        ...sx,
      }}
    />
  );
}
