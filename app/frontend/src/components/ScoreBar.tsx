import React from "react";
import {
  Container,
  ContainerProps,
  LinearProgress,
  makeStyles,
} from "@material-ui/core";
import TextBody from "./TextBody";

const useStyles = makeStyles((theme) => ({
  root: {
    position: "relative",
    height: theme.spacing(3),
    marginInlineStart: 0,
    marginBottom: theme.spacing(1),
    width: "100%",
    maxWidth: 300,
  },
  scoreBar: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: theme.spacing(1.5),
  },
  scoreBarLabel: {
    position: "absolute",
    width: "100%",
    lineHeight: theme.spacing(3),
    verticalAlign: "middle",
    paddingLeft: theme.spacing(3),
  },
}));

interface ScoreBarProps extends ContainerProps {
  value: number;
}

export default function SearchResult({ value, children }: ScoreBarProps) {
  const classes = useStyles();
  return (
    <Container disableGutters className={classes.root}>
      <LinearProgress
        variant="determinate"
        value={value}
        className={classes.scoreBar}
      />
      <TextBody className={classes.scoreBarLabel}>{children}</TextBody>
    </Container>
  );
}
