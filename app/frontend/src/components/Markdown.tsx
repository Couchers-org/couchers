import { Box, BoxProps, makeStyles } from "@material-ui/core";
import MarkdownIt from "markdown-it";
import React from "react";

const md = new MarkdownIt().disable("image");

interface MarkdownProps extends BoxProps {
  source: string;
}

const useStyles = makeStyles((theme) => ({
  root: {
    fontFamily: theme.typography.fontFamily,
  },
}));

export default function Markdown({ source, ...otherProps }: MarkdownProps) {
  const classes = useStyles();
  return (
    <Box
      className={classes.root}
      dangerouslySetInnerHTML={{ __html: md.render(source) }}
      {...otherProps}
    />
  );
}
