import { IconButton, styled, Tooltip } from "@mui/material";
import { HelpIcon } from "components/Icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { theme } from "theme";

import { GLOBAL } from "../../i18n/namespaces";
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

export default function BarWithHelp({ value, label, description, className }: BarWithHelpProps) {
  const { t } = useTranslation(GLOBAL);

  return process.env.NEXT_PUBLIC_IS_POST_BETA_ENABLED ? (
    <StyledWrapper className={className}>
      <ScoreBar value={value}>{label}</ScoreBar>
      <Tooltip title={description}>
        <IconButton
          aria-label={t("global:bar.help_button_a11y")}
          size="large"
          sx={{ padding: 0, paddingLeft: theme.spacing(1) }}
        >
          <HelpIcon />
        </IconButton>
      </Tooltip>
    </StyledWrapper>
  ) : null;
}
