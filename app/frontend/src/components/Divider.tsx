import { Divider as MuiDivider } from "@material-ui/core";
import React from "react";
import makeStyles from "utils/makeStyles";
import classNames from "classnames";

const useStyles = makeStyles((theme) => ({
  root: {
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
  },

  marginTopExtra1: {
    marginTop: theme.spacing(3),
  },

  marginBottomExtra1: {
    marginBottom: theme.spacing(3),
  },
}));

export interface DividerProps {
  margBottom?: boolean;
  margTop?: boolean;
}

export default function Divider({ margTop, margBottom }: DividerProps) {
  const classes = useStyles();

  return (
    <MuiDivider
      className={classNames(
        classes.root,
        { [classes.marginTopExtra1]: margTop },
        { [classes.marginBottomExtra1]: margBottom }
      )}
    />
  );
}
