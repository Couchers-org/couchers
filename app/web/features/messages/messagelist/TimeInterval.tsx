import { Typography } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import classNames from "classnames";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import React from "react";
import { timeAgoI18n } from "utils/timeAgo";

const useStyles = makeStyles((theme) => ({
  root: {
    paddingInlineEnd: theme.spacing(1),
  },
}));

export interface TimeIntervalProps {
  date: Date;
  className?: string;
}

export default function TimeInterval({ date, className }: TimeIntervalProps) {
  const { t } = useTranslation(GLOBAL);
  const classes = useStyles();

  return (
    <div className={classNames(className, classes.root)}>
      <Typography variant="caption">
        {timeAgoI18n({ input: date, t })}
      </Typography>
    </div>
  );
}
