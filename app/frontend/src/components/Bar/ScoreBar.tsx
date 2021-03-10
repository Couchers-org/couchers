import {
  Container,
  ContainerProps,
  LinearProgress,
  makeStyles,
} from "@material-ui/core";
import React from "react";

import TextBody from "../TextBody";

const useStyles = makeStyles((theme) => ({
  root: {
    height: theme.spacing(3),
    marginInlineStart: 0,
    maxWidth: 300,
    position: "relative",
    width: "100%",
  },
  scoreBar: {
    borderRadius: theme.spacing(1.5),
    height: "100%",
    position: "absolute",
    width: "100%",
  },
  scoreBarLabel: {
    color: theme.palette.common.white,
    lineHeight: theme.spacing(3),
    paddingLeft: theme.spacing(3),
    position: "absolute",
    verticalAlign: "middle",
    width: "100%",
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
