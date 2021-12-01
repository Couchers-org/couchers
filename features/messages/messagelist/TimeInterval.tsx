import { Box, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import classNames from "classnames";
import React from "react";

import { timeAgo } from "../../../utils/timeAgo";

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
  const classes = useStyles();
  return (
    <Box className={classNames(className, classes.root)}>
      <Typography variant="caption">{timeAgo(date)}</Typography>
    </Box>
  );
}
