import { Typography } from "@mui/material";
import { styled } from "@mui/system";
import { theme } from "theme";

interface PillStylesProps {
  backgroundColor?: string;
  color?: string;
}

const StyledPill = styled(Typography)<PillStylesProps>(({ theme }) => ({
  padding: theme.spacing(0.6, 1),
  textAlign: "center",
  fontWeight: "bold",
  margin: theme.spacing(0.5),
  fontSize: ".8rem",
}));

export interface PillProps {
  children: React.ReactNode;
  backgroundColor?: string;
  color?: string;
  variant?: "rounded";
}

export default function Pill({
  children,
  backgroundColor = theme.palette.grey[200],
  color = theme.palette.text.primary,
  variant = "rounded",
}: PillProps) {
  return (
    <StyledPill
      sx={{
        backgroundColor,
        color,
        ...(variant === "rounded" && {
          borderRadius: theme.shape.borderRadius * 6,
        }),
      }}
    >
      {children}
    </StyledPill>
  );
}
