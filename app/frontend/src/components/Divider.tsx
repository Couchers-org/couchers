import { Divider as MuiDivider } from "@material-ui/core";
import classNames from "classnames";
import React from "react";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
  },

  marginTop3: {
    marginTop: theme.spacing(3),
  },

  marginBottom3: {
    marginBottom: theme.spacing(3),
  },
}));

export interface DividerProps {
  mb3?: boolean;
  mt3?: boolean;
}

export default function Divider({ mt3, mb3 }: DividerProps) {
  const classes = useStyles();

  return (
    <MuiDivider
      className={classNames(
        classes.root,
        { [classes.marginTop3]: mt3 },
        { [classes.marginBottom3]: mb3 }
      )}
    />
  );
}
