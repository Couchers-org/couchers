import { Typography, TypographyProps } from "@material-ui/core";
import React from "react";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
}));

export default function PageTitle(props: TypographyProps) {
  const classes = useStyles();

  return <Typography {...props} classes={{ h1: classes.root }} variant="h1" />;
}
