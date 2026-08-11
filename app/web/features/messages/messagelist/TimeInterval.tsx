import { styled, Typography } from "@mui/material";
import RelativeTime from "components/RelativeTime";
import React from "react";
import { Temporal } from "temporal-polyfill";

const StyledTypography = styled(Typography)(({ theme }) => ({
  fontSize: "0.75rem", // 12px
}));

interface TimeIntervalProps {
  instant: Temporal.Instant;
  className?: string;
}

export default function TimeInterval({ instant, className }: TimeIntervalProps) {
  return (
    <StyledTypography className={className} variant="caption">
      <RelativeTime instant={instant} />
    </StyledTypography>
  );
}
