import { Box, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import classNames from "classnames";
import moment from "moment";
import React from "react";

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
      <Typography variant="caption">{moment(date).fromNow()}</Typography>
    </Box>
  );
}
