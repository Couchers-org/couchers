import { styled, Typography } from "@mui/material";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import React from "react";
import { timeAgoI18n } from "utils/timeAgo";

const Root = styled("div")(({ theme }) => ({
  paddingInlineEnd: theme.spacing(1),
}));

interface TimeIntervalProps {
  date: Date;
  className?: string;
}

export default function TimeInterval({ date, className }: TimeIntervalProps) {
  const { t } = useTranslation(GLOBAL);

  return (
    <Root className={className}>
      <Typography variant="caption">
        {timeAgoI18n({ input: date, t })}
      </Typography>
    </Root>
  );
}
