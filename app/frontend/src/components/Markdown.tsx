import React from "react";
import MarkdownIt from "markdown-it";
import { Box, BoxProps } from "@material-ui/core";

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
