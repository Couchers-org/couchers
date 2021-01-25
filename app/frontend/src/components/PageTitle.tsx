import { makeStyles, Typography, TypographyProps } from "@material-ui/core";
import React from "react";

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    fontWeight: theme.typography.fontWeightBold,
  },
}));

export default function PageTitle(props: TypographyProps) {
  const classes = useStyles();

  return <Typography {...props} classes={{ h1: classes.root }} variant="h1" />;
}
