import { Divider as MuiDivider, Theme } from "@mui/material";
import classNames from "classnames";
import React from "react";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles<Theme, { spacing: number }>((theme) => ({
  root: (props) => ({
    marginBottom: theme.spacing(props.spacing),
    marginTop: theme.spacing(props.spacing),
  }),
}));

export interface DividerProps {
  className?: string;
  spacing?: number;
}

export default function Divider({ className, spacing = 2 }: DividerProps) {
  const classes = useStyles({ spacing });

  return <MuiDivider className={classNames(classes.root, className)} />;
}
