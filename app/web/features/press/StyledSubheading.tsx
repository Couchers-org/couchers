import { styled } from "@mui/material";
import { PropsWithChildren } from "react";

const StyledHeading = styled("h2")(({ theme }) => ({
  fontSize: "1.75rem",
  fontWeight: "500",
  textAlign: "center",
  marginTop: 0,
  marginBottom: 0,

  [theme.breakpoints.up("md")]: {
    fontSize: "2rem",
  },
}));

export default function StyledSubheading({ children }: PropsWithChildren) {
  return <StyledHeading>{children}</StyledHeading>;
}
