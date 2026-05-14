import { Group } from "@mui/icons-material";
import { styled } from "@mui/material";
import { ReactNode } from "react";

const StyledUsersCountTag = styled("span")({
  display: "inline-flex",
  alignItems: "center",
  gap: "3px",
  color: "var(--mui-palette-text-secondary)",
  fontSize: "11px",
  fontWeight: 600,
  padding: "2px 8px",
  whiteSpace: "nowrap",
});

interface UsersCountTagProps {
  children: ReactNode;
}

export default function UsersCountTag({ children }: UsersCountTagProps) {
  return (
    <StyledUsersCountTag>
      <Group sx={{ fontSize: "11px" }} />
      {children}
    </StyledUsersCountTag>
  );
}
