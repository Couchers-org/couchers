import { Theme, Typography, styled } from "@mui/material";
// eslint-disable-next-line no-restricted-imports
import { SystemStyleObject } from "@mui/system";

import { theme } from "@/theme";

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
  onClick?: () => void;
  variant?: "rounded";
  sx?: SystemStyleObject<Theme>;
}

const Pill = ({
  children,
  backgroundColor = theme.palette.grey[200],
  color = theme.palette.text.primary,
  onClick,
  sx,
}: PillProps) => {
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
        borderRadius: theme.shape.borderRadius * 6,
        ...sx,
      }}
      onClick={handleClick}
    >
      {children}
    </StyledPill>
  );
};

export default Pill;
