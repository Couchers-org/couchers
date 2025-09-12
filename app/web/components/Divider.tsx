import { Divider as MuiDivider, Theme } from "@mui/material";
// eslint-disable-next-line no-restricted-imports
import { SystemStyleObject } from "@mui/system";
import React from "react";

import { theme } from "@/theme";

export interface DividerProps {
  className?: string;
  spacing?: number;
  sx?: SystemStyleObject<Theme>;
}

const Divider = ({ className, spacing = 2, sx }: DividerProps) => {
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
};

export default Divider;
