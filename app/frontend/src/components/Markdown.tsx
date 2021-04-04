import "@toast-ui/editor/dist/toastui-editor-viewer.css";

import { makeStyles } from "@material-ui/core";
import ToastUIViewer from "@toast-ui/editor/dist/toastui-editor-viewer";
import { useEffect, useRef } from "react";

interface MarkdownProps {
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
}: MarkdownProps) {
  const classes = useStyles();

  const rootEl = useRef<HTMLDivElement>(null);
  const viewer = useRef<ToastUIViewer>();
  useEffect(() => {
    viewer.current = new ToastUIViewer({
      el: rootEl.current!,
      initialValue: increaseMarkdownHeaderLevel(source, topHeaderLevel),
    });
    return () => viewer.current?.remove();
  }, [source, topHeaderLevel]);

  return <div className={classes.root} ref={rootEl} />;
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
