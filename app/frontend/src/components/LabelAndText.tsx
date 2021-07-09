import { Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import classNames from "classnames";
import React from "react";

import TextBody from "./TextBody";

const useStyles = makeStyles((theme) => ({
  label: {
    margin: 0,
  },
  root: {
    display: "flex",
    marginTop: theme.spacing(0.5),
  },
  flexItem: {
    flex: "1 1 50%",
  },
}));

export interface LabelAndTextProps {
  label: string;
  text: string;
}

export default function LabelAndText({ label, text }: LabelAndTextProps) {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Typography
        variant="h3"
        className={classNames(classes.label, classes.flexItem)}
      >
        {label}
      </Typography>
      <TextBody className={classes.flexItem}>{text}</TextBody>
    </div>
  );
}
