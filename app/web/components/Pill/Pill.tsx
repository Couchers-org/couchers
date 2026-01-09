import { styled, SxProps, Typography } from "@mui/material";
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

interface PillProps {
  children: React.ReactNode;
  backgroundColor?: string;
  color?: string;
  onClick?: () => void;
  variant?: "rounded";
  sx?: SxProps;
}

export default function Pill({
  children,
  backgroundColor = "var(--mui-palette-grey-200)",
  color = "var(--mui-palette-text-primary)",
  onClick,
  variant = "rounded",
  sx,
}: PillProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <StyledPill
      sx={{
        backgroundColor,
        color,
        ...(variant === "rounded" && {
          borderRadius: theme.shape.borderRadius * 6,
        }),
        ...(sx || {}),
      }}
      onClick={handleClick}
    >
      {children}
    </StyledPill>
  );
}
