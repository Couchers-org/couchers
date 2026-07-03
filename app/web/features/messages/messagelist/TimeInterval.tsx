import { styled, Typography } from "@mui/material";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import React from "react";
import { timeAgo } from "utils/timeAgo";

const StyledTypography = styled(Typography)(({ theme }) => ({
  fontSize: "0.75rem", // 12px
}));

interface TimeIntervalProps {
  date: Date;
  className?: string;
}

export default function TimeInterval({ date, className }: TimeIntervalProps) {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation(GLOBAL);

  return (
    <StyledTypography className={className} variant="caption">
      {timeAgo({ since: date, t, locale })}
    </StyledTypography>
  );
}
