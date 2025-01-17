import { Divider, styled, Typography } from "@mui/material";
import React from "react";
import { theme } from "theme";

const StyledHeader = styled("div")(({ theme }) => ({
  marginBottom: theme.spacing(4),
  position: "relative",
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  border: "3px solid rgba(246, 138, 12, 0.7)",
  boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
  left: theme.spacing(1),
  position: "absolute",
  width: "100%",
}));

// @TODO(NA): I don't think we're using this component anymore. Do we need to keep it?
export default function AuthHeader(props: { children: React.ReactNode }) {
  return (
    <StyledHeader>
      <Typography
        variant="h1"
        sx={{
          [theme.breakpoints.up("md")]: {
            marginTop: 0,
          },
        }}
      >
        {props.children}
      </Typography>
      <StyledDivider />
    </StyledHeader>
  );
}
