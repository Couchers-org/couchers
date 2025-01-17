import { styled, Typography } from "@mui/material";
import { OverridableComponent } from "@mui/material/OverridableComponent";
import { SvgIconTypeMap } from "@mui/material/SvgIcon";
import React, { ReactNode } from "react";
import { theme } from "theme";

const StyledWrapper = styled("div")(({ theme }) => ({
  alignItems: "center",
  display: "flex",
  marginBottom: theme.spacing(1),
  marginTop: theme.spacing(1),
}));

const StyledLabel = styled("div")(({ theme }) => ({
  marginInlineStart: theme.spacing(1),
}));

interface IconTextProps {
  icon: OverridableComponent<SvgIconTypeMap<unknown, "svg">>;
  text: ReactNode;
}

export default function IconText({ icon, text }: IconTextProps) {
  const Icon = icon;
  return (
    <StyledWrapper>
      <Icon />
      {typeof text === "string" ? (
        <Typography sx={{ marginInlineStart: theme.spacing(1) }}>
          {text}
        </Typography>
      ) : (
        <StyledLabel>{text}</StyledLabel>
      )}
    </StyledWrapper>
  );
}
