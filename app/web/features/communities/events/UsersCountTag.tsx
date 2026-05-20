import { Group } from "@mui/icons-material";
import { styled } from "@mui/material";
import { ReactNode } from "react";

type Size = "small" | "medium";

const fontSizeMap: Record<Size, string> = {
  small: "11px",
  medium: "14px",
};

const StyledUsersCountTag = styled("span")<{ size: Size }>(({ size }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "3px",
  color: "var(--mui-palette-text-secondary)",
  fontSize: fontSizeMap[size],
  fontWeight: 600,
  padding: "2px 8px",
  whiteSpace: "nowrap",
}));

interface UsersCountTagProps {
  children: ReactNode;
  size?: Size;
}

export default function UsersCountTag({
  children,
  size = "small",
}: UsersCountTagProps) {
  return (
    <StyledUsersCountTag size={size}>
      <Group sx={{ fontSize: fontSizeMap[size] }} />
      {children}
    </StyledUsersCountTag>
  );
}
