import { Divider as MuiDivider, SxProps } from "@mui/material";
import React from "react";

interface DividerProps {
  className?: string;
  spacing?: number;
  sx?: SxProps;
}

export default function Divider({ className, spacing = 2, sx }: DividerProps) {
  return (
    <MuiDivider
      className={className}
      sx={{
        marginBottom: spacing,
        marginTop: spacing,
        ...sx,
      }}
    />
  );
}
