import { Typography } from "@material-ui/core";
import classNames from "classnames";
import React from "react";

import makeStyles from "../../../utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    margin: theme.spacing(4, 0),
  },
}));

type SectionProps = {
  title: string;
  content: string | React.ReactNode;
  className?: string;
};

export default function Section({ title, content, className }: SectionProps) {
  const classes = useStyles();
  const sectionClass = classNames(classes.root, className);

  return (
    <div className={sectionClass}>
      <Typography variant="h2">{title}</Typography>
      <Typography variant="body1">{content}</Typography>
    </div>
  );
}
