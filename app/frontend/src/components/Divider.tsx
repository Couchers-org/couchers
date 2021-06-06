import { Divider as MuiDivider } from "@material-ui/core";
import classNames from "classnames";
import React from "react";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
}));

export interface DividerProps {
  className?: string;
}

export default function Divider({ className }: DividerProps) {
  const classes = useStyles();

  return <MuiDivider className={classNames(classes.root, className)} />;
}
