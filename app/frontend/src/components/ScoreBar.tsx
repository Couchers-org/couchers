import React from "react";
import { Container, LinearProgress, makeStyles } from "@material-ui/core";
import TextBody from "./TextBody";

const useStyles = makeStyles((theme) => ({
  root: {
    position: "relative",
    height: "1.6rem",
    marginInlineStart: 0,
    marginBottom: theme.spacing(1),
    width: "100%",
    maxWidth: 300,
  },
  scoreBar: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: ".8rem",
  },
  scoreBarLabel: {
    position: "absolute",
    width: "100%",
    lineHeight: "1.6rem",
    verticalAlign: "middle",
    paddingLeft: theme.spacing(1),
  },
}));

interface ScoreBarProps {
  value: number;
  label?: string;
}

export default function SearchResult({ value, label }: ScoreBarProps) {
  const classes = useStyles();
  return (
    <Container disableGutters className={classes.root}>
      <LinearProgress
        variant="determinate"
        value={value}
        className={classes.scoreBar}
      />
      <TextBody className={classes.scoreBarLabel}>{label}</TextBody>
    </Container>
  );
}
