import { Box } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React from "react";
import moment from "moment";
import classNames from "classnames";

const useStyles = makeStyles((theme) => ({
  root: {
    color: theme.typography.caption.color,
    fontSize: theme.typography.caption.fontSize,
    paddingInlineEnd: theme.spacing(1),
  },
}));

export interface MomentIndicationProps {
  date: Date;
  className?: string;
}

export default function TimeInterval({
  date,
  className,
}: MomentIndicationProps) {
  const classes = useStyles();
  return (
    <Box className={classNames(className, classes.root)}>
      {moment(date).fromNow()}
    </Box>
  );
}
