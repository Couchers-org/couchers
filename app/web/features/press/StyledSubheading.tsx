import { styled } from "@mui/system";
import { PropsWithChildren } from "react";

const StyledHeading = styled("h2")({
  fontSize: "2rem",
  fontWeight: "500",
  textAlign: "center",
  marginTop: 0,
  marginBottom: 0,
});

export default function StyledSubheading({ children }: PropsWithChildren) {
  return <StyledHeading>{children}</StyledHeading>;
}
