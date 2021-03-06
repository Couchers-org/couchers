import { IconButton, makeStyles, Tooltip } from "@material-ui/core";
import { HelpIcon } from "components/Icons";
import React from "react";

import ScoreBar from "./ScoreBar";

const useStyles = makeStyles((theme) => ({
  button: {
    padding: theme.spacing(1),
  },
  root: {
    alignItems: "center",
    display: "flex",
  },
}));

interface BarWithHelpProps {
  value: number;
  label: string;
  description: string;
}

export default function BarWithHelp({
  value,
  label,
  description,
}: BarWithHelpProps) {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <ScoreBar value={value} children={label}></ScoreBar>
      <Tooltip title={description}>
        <IconButton aria-label="help icon" className={classes.button}>
          <HelpIcon />
        </IconButton>
      </Tooltip>
    </div>
  );
}
