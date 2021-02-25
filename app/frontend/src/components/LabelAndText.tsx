import { Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React from "react";

import TextBody from "./TextBody";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    marginTop: theme.spacing(0.5),
  },
  label: {
    margin: "inherit",
    width: "50%",
  },
}));

export interface LabelAndTextProps {
  label: string,
  text: string,
}

export default function LabelAndText({ label, text }: LabelAndTextProps) {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Typography variant="h3" className={classes.label}>{label}</Typography> 
      <TextBody>{text}</TextBody>
    </div>
  );
}
