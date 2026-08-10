import { styled, Typography } from "@mui/material";
import { ReactNode } from "react";
import { theme } from "theme";

const StyledWrapper = styled("div")(() => ({
  alignItems: "center",
  display: "flex",
}));

const StyledText = styled(Typography)(() => ({
  margin: 0,
  marginInlineStart: theme.spacing(1),
}));

interface TitleWithIconProps {
  icon: ReactNode;
  children: string;
  variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export default function TitleWithIcon({ icon, children, variant = "h1" }: TitleWithIconProps) {
  return (
    <StyledWrapper>
      {icon}
      <StyledText variant={variant}>{children}</StyledText>
    </StyledWrapper>
  );
}
