import { IconButton, styled, Tooltip } from "@mui/material";
import { HelpIcon } from "components/Icons";
import React from "react";
import { theme } from "theme";

import ScoreBar from "./ScoreBar";

interface BarWithHelpProps {
  value: number;
  label: string;
  description: string;
  className?: string;
}

const StyledWrapper = styled("div")(({ theme }) => ({
  alignItems: "center",
  display: "flex",
  marginBottom: theme.spacing(2),
}));

export default function BarWithHelp({
  value,
  label,
  description,
  className,
}: BarWithHelpProps) {
  return process.env.NEXT_PUBLIC_IS_POST_BETA_ENABLED ? (
    <StyledWrapper className={className}>
      <ScoreBar value={value}>{label}</ScoreBar>
      <Tooltip title={description}>
        <IconButton
          aria-label="help icon"
          size="large"
          sx={{ padding: 0, paddingLeft: theme.spacing(1) }}
        >
          <HelpIcon />
        </IconButton>
      </Tooltip>
    </StyledWrapper>
  ) : null;
}
