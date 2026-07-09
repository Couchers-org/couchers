import { styled, Typography } from "@mui/material";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import React from "react";
import { Temporal } from "temporal-polyfill";

import { localizeRelativeInstant } from "../../../utils/date";

const StyledTypography = styled(Typography)(({ theme }) => ({
  fontSize: "0.75rem", // 12px
}));

interface TimeIntervalProps {
  instant: Temporal.Instant;
  className?: string;
}

export default function TimeInterval({
  instant,
  className,
}: TimeIntervalProps) {
  const {
    i18n: { language: locale },
  } = useTranslation(GLOBAL);

  return (
    <StyledTypography className={className} variant="caption">
      {localizeRelativeInstant(instant, locale)}
    </StyledTypography>
  );
}
