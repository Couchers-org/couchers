import { Box, BoxProps } from "@material-ui/core";
import MarkdownIt from "markdown-it";
import React from "react";

const md = new MarkdownIt().disable("image");

interface MarkdownProps extends BoxProps {
  source: string;
}

export default function Markdown({ source, ...otherProps }: MarkdownProps) {
  return (
    <Box
      dangerouslySetInnerHTML={{ __html: md.render(source) }}
      {...otherProps}
    />
  );
}
