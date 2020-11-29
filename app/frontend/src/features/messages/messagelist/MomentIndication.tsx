import { Box } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React from "react";
import moment from "moment";

const useStyles = makeStyles({ root: {} });

export interface MomentIndicationProps {
  date: Date;
}

export default function TimeInterval({ date }: MomentIndicationProps) {
  const classes = useStyles();
  return <Box className={classes.root}>{moment(date).fromNow()}</Box>;
}
