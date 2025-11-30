import { styled, SxProps, Typography, useTheme } from "@mui/material";

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
  backgroundColor,
  color,
  onClick,
  variant = "rounded",
  sx,
}: PillProps) {
  const theme = useTheme();
  const defaultBackgroundColor = backgroundColor ?? theme.palette.grey[200];
  const defaultColor = color ?? theme.palette.text.primary;

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <StyledPill
      sx={{
        backgroundColor: defaultBackgroundColor,
        color: defaultColor,
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
