import {
  Container,
  ContainerProps,
  LinearProgress,
  Typography,
} from "@material-ui/core";
import React from "react";
import makeStyles from "utils/makeStyles";

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
    paddingLeft: theme.spacing(2),
    position: "absolute",
    verticalAlign: "middle",
    width: "100%",
    fontSize: "0.75rem",
  },
}));

interface ScoreBarProps extends ContainerProps {
  value: number;
}

export default function SearchResult({ value, children }: ScoreBarProps) {
  const classes = useStyles();
  return process.env.NEXT_PUBLIC_IS_POST_BETA_ENABLED ? (
    <Container disableGutters className={classes.root}>
      <LinearProgress
        variant="determinate"
        value={value}
        className={classes.scoreBar}
      />
      <Typography className={classes.scoreBarLabel} noWrap>
        {children}
      </Typography>
    </Container>
  ) : null;
}
