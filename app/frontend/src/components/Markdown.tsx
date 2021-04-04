import { Box, BoxProps, makeStyles } from "@material-ui/core";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt().disable("image");

interface MarkdownProps extends BoxProps {
  source: string;
  topHeaderLevel?: number;
}

const useStyles = makeStyles((theme) => ({
  root: {
    fontSize: theme.typography.fontSize,
    fontFamily: theme.typography.fontFamily,
    "& h1": {
      borderBottom: "none",
      ...theme.typography.h1,
    },
    "& h2": {
      borderBottom: "none",
      ...theme.typography.h2,
    },
    "& h3": theme.typography.h3,
    "& h4": theme.typography.h4,
    "& h5": theme.typography.h5,
    "& h6": theme.typography.h6,
    "& a": {
      color: theme.palette.primary.main,
    },
  },
}));

export default function Markdown({
  source,
  topHeaderLevel = 2,
  ...otherProps
}: MarkdownProps) {
  const classes = useStyles();

  return (
    <Box
      className={classes.root}
      dangerouslySetInnerHTML={{
        __html: md.render(increaseMarkdownHeaderLevel(source, topHeaderLevel)),
      }}
      {...otherProps}
    />
  );
}

export function increaseMarkdownHeaderLevel(
  source: string,
  topHeaderLevel: number
) {
  let convertedSource = source;
  for (let i = 6; i >= 1; i--) {
    //loop through each header level, and add extra # as necessary
    //also put a ~ in front so we know that line is done
    convertedSource = convertedSource.replace(
      new RegExp(`^${"#".repeat(i)}`, "gm"),
      `~${"#".repeat(Math.min(i + topHeaderLevel - 1, 6))}`
    );
  }
  //take out the ~ markers (line start only)
  return convertedSource.replace(/^~#/gm, "#");
}
