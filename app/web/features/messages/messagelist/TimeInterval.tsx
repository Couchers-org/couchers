import { Typography, styled } from "@mui/material";
import React from "react";

import { useTranslation } from "@/i18n";
import { GLOBAL } from "@/i18n/namespaces";
import { timeAgoI18n } from "@/utils/timeAgo";

const Root = styled("div")(({ theme }) => ({
  paddingInlineEnd: theme.spacing(1),
}));

export interface TimeIntervalProps {
  date: Date;
  className?: string;
}

const TimeInterval = ({ date, className }: TimeIntervalProps) => {
  const { t } = useTranslation(GLOBAL);

  return (
    <Root className={className}>
      <Typography variant="caption">
        {timeAgoI18n({ input: date, t })}
      </Typography>
    </Root>
  );
};

export default TimeInterval;
