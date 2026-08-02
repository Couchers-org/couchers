import { Box, styled, SxProps, Theme } from "@mui/material";
import { ReactNode } from "react";

const StyledWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: "1rem",

  [theme.breakpoints.up("md")]: {
    gap: "1.5rem",
  },
}));

type SectionWrapperProps = {
  children?: ReactNode;
  sx?: SxProps<Theme>;
};

export default function SectionWrapper({ children, sx }: SectionWrapperProps) {
  return <StyledWrapper sx={sx}>{children}</StyledWrapper>;
}
