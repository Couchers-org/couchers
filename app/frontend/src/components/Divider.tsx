import { Divider as MuiDivider, makeStyles } from "@material-ui/core";
import React from "react";

const useStyles = makeStyles((theme) => ({
  root: {
    marginBottom: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
}));

export default function Divider() {
  const classes = useStyles();

  return <MuiDivider className={classes.root} />;
}
